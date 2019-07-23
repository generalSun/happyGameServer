package com.beimi.core.engine.game;

import java.util.Date;
import java.util.List;

import javax.annotation.Resource;

import org.apache.commons.lang3.StringUtils;
import org.kie.api.runtime.KieSession;

import com.beimi.config.game.BeiMiGameEvent;
import com.beimi.config.game.BeiMiGameEnum;
import com.beimi.core.BMDataContext;
import com.beimi.util.RandomCharUtil;
import com.beimi.util.UKTools;
import com.beimi.cache.CacheHelper;
import com.beimi.client.NettyClients;
import com.beimi.server.handler.BeiMiClient;
import com.beimi.web.model.GamePlayway;
import com.beimi.web.model.GameRoom;
import com.beimi.web.model.PlayUserClient;
import com.beimi.web.service.repository.jpa.GameRoomRepository;
import com.beimi.config.game.Game;
import com.beimi.game.rules.model.RoomReady;

public class roomTools {
	private static roomTools instance;

	public static roomTools getInstance(){
		if(instance == null){
			instance = new roomTools();
		}
		return instance;
	}
	@Resource
	private KieSession kieSession;

	/**
	 * 通知就绪
	 * @param gameRoom
	 * @param game
	 */
	public void roomReady(GameRoom gameRoom, Game game){
		boolean enough = false ;
		List<PlayUserClient> playerList = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi()) ;
		if(gameRoom.getPlayers() == playerList.size()){
			gameRoom.setStatus(BeiMiGameEnum.READY.toString());
			boolean hasnotready = false ;
			for(PlayUserClient player : playerList){
				if(player.isRoomready() == false){
					hasnotready = true ;  break ;
				}
			}
			if(hasnotready == false){
				enough = true ;	//所有玩家都已经点击了 开始游戏
			}
			
			/**
			 * 检查当前玩家列表中的所有玩家是否已经全部 就绪，如果已经全部就绪，则开始游戏 ， 否则，只发送 roomready事件
			 */
			EventTools.getInstance().sendEvent("roomready", new RoomReady(gameRoom), gameRoom);
		}else{
			gameRoom.setStatus(BeiMiGameEnum.WAITTING.toString());
		}
		CacheHelper.getGameRoomCacheBean().put(gameRoom.getId(), gameRoom, gameRoom.getOrgi());
		/**
		 * 所有人都已经举手
		 */
		if(enough == true){
			game.change(gameRoom , BeiMiGameEvent.ENOUGH.toString());	//通知状态机 , 此处应由状态机处理异步执行
		}
	}

	/**
	 * 
	 * 玩家加入房间
	 * @param gameRoom
	 * @param playUser
	 * @param playerList
	 */
	public void joinRoom(GameRoom gameRoom , PlayUserClient playUser , List<PlayUserClient> playerList){
		boolean inroom = false ;
		for(PlayUserClient user : playerList){
			if(user.getId().equals(playUser.getId())){
				inroom = true ; break ;
			}
		}
		if(inroom == false){
			playUser.setPlayerindex(System.currentTimeMillis());
			playUser.setGamestatus(BMDataContext.GameStatusEnum.READY.toString());
			playUser.setPlayertype(BMDataContext.PlayerTypeEnum.NORMAL.toString());
			playUser.setRoomid(gameRoom.getId());
			playUser.setRoomready(false);
			
			playerList.add(playUser) ;
			playUser.setServerIndex(playerList.indexOf(playUser));
			NettyClients.getInstance().joinRoom(playUser.getId(), gameRoom.getId());
			CacheHelper.getGamePlayerCacheBean().put(playUser.getId(), playUser, playUser.getOrgi()); //将用户加入到 room ， MultiCache
		}
		
		/**
		 *	不管状态如何，玩家一定会加入到这个房间 
		 */
		CacheHelper.getRoomMappingCacheBean().put(playUser.getId(), gameRoom.getId(), playUser.getOrgi());
	}
	
	/**
	 * 加入房间，房卡游戏
	 * @param roomid

	 * @param orgi
	 * @return
	 */
	public GameRoom joinRoom(String roomid, PlayUserClient playUser, String orgi){
		GameRoom gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, orgi) ;
		if(gameRoom!=null){
			CacheHelper.getGamePlayerCacheBean().put(gameRoom.getId(), playUser, orgi); //将用户加入到 room ， MultiCache
		}
		return gameRoom ;
	}
	
	/**
	 * 退出房间
	 * 1、房卡模式，userid是房主，则解散房间
	 * 2、大厅模式，如果游戏未开始并且房间仅有一人，则解散房间
	 * @param orgi
	 * @return
	 */
	public GameRoom leaveRoom(PlayUserClient playUser , String orgi){
		GameRoom gameRoom = whichRoom(playUser.getId(), orgi) ;
		if(gameRoom!=null){
			List<PlayUserClient> players = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), orgi) ;
			if(gameRoom.isCardroom()){
				if(gameRoom.getMaster().equals(playUser.getId())){
					CacheHelper.getGameRoomCacheBean().delete(gameRoom.getId(), gameRoom.getOrgi()) ;
					CacheHelper.getGamePlayerCacheBean().clean(gameRoom.getId() , orgi) ;
					UKTools.published(gameRoom , null , BMDataContext.getContext().getBean(GameRoomRepository.class) , BMDataContext.UserDataEventType.DELETE.toString());
				}
			}else{
				if(players.size() <= 1){
					//解散房间 , 保留 ROOM资源 ， 避免 从队列中取出ROOM
					CacheHelper.getGamePlayerCacheBean().clean(gameRoom.getId() , orgi) ;
				}else{
					CacheHelper.getGamePlayerCacheBean().delete(playUser.getId(), orgi) ;
				}
			}
		}
		return gameRoom;
	}

	/**
	 * 当前用户所在的房间
	 * @param userid
	 * @param orgi
	 * @return
	 */
	public GameRoom whichRoom(String userid, String orgi){
		GameRoom gameRoom = null ;
		String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(userid, orgi) ;
		if(!StringUtils.isBlank(roomid)){//
			gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, orgi) ;		//直接加入到 系统缓存 （只有一个地方对GameRoom进行二次写入，避免分布式锁）
		}
		return gameRoom;
	}
	
	/**
	 * 结束 当前牌局

	 * @param orgi
	 * @return
	 */
	public void finished(String roomid, String orgi){
		if(!StringUtils.isBlank(roomid)){//
			CacheHelper.getExpireCache().remove(roomid);
			CacheHelper.getBoardCacheBean().delete(roomid, orgi) ;
		}
	}

	/**
	 * 创建新房间 ，需要传入房间的玩法 ， 玩法定义在 系统运营后台，玩法创建后，放入系统缓存 ， 客户端进入房间的时候，传入 玩法ID参数
	 * @param playway
	 * @param userid
	 * @return
	 */
	private  GameRoom creatGameRoom(GamePlayway playway , String userid , boolean cardroom , BeiMiClient beiMiClient){
		GameRoom gameRoom = new GameRoom() ;
		gameRoom.setCreatetime(new Date());
		gameRoom.setRoomid(UKTools.getUUID());
		gameRoom.setUpdatetime(new Date());
		gameRoom.setCurpalyers(1);
		gameRoom.setCardroom(cardroom);
		gameRoom.setStatus(BeiMiGameEnum.CRERATED.toString());
		gameRoom.setCurrentnum(0);
		gameRoom.setCatchfailTimes(0);
		gameRoom.setAutoMatch(false);
		gameRoom.setCreater(userid);
		gameRoom.setMaster(userid);
		
		if(playway != null){
			gameRoom.setPlayway(playway.getId());
			gameRoom.setRoomtype(playway.getRoomtype());
			gameRoom.setPlayers(playway.getPlayers());
			gameRoom.setCardsnum(playway.getCardsnum());
			gameRoom.setCode(playway.getCode());
			gameRoom.setNumofgames(playway.getNumofgames());   //无限制
			gameRoom.setOrgi(playway.getOrgi());
		}

		if(beiMiClient.getExtparams() != null && BMDataContext.BEIMI_SYSTEM_ROOM.equals(beiMiClient.getExtparams().get("gamemodel"))){
			gameRoom.setRoomtype(BMDataContext.ModelType.ROOM.toString());
			gameRoom.setCardroom(true);
			gameRoom.setExtparams(beiMiClient.getExtparams());
			gameRoom.setRoomid(RandomCharUtil.getRandomNumberChar(6));
			kieSession.insert(gameRoom) ;
			kieSession.fireAllRules() ;
		}else{
			gameRoom.setRoomtype(BMDataContext.ModelType.HALL.toString());
		}

		if(gameRoom.getExtparams() != null && "true".equals(gameRoom.getExtparams().get("automatch"))){
			gameRoom.setAutoMatch(true);
			CacheHelper.getQueneCache().put(gameRoom, gameRoom.getOrgi());	//未达到最大玩家数量，加入到游戏撮合 队列，继续撮合
		}
		UKTools.published(gameRoom, null, BMDataContext.getContext().getBean(GameRoomRepository.class) , BMDataContext.UserDataEventType.SAVE.toString());
		return gameRoom ;
	}
	
	
	/**
	 * 解散房间 , 解散的时候，需要验证下，当前对象是否是房间的创建人
	 */
	public void dismissRoom(GameRoom gameRoom , String userid,String orgi){
		if(gameRoom.getMaster().equals(userid)){
			CacheHelper.getGamePlayerCacheBean().delete(gameRoom.getId(), orgi) ;
			List<PlayUserClient> players = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), orgi) ;
			for(PlayUserClient player : players){
				/**
				 * 解散房间的时候，只清理 AI
				 */
				if(player.getPlayertype().equals(BMDataContext.PlayerTypeEnum.AI.toString())){
					CacheHelper.getGamePlayerCacheBean().delete(player.getId(), orgi) ;
					CacheHelper.getRoomMappingCacheBean().delete(player.getId(), orgi) ;
				}
			}
			/**
			 * 先不删
			 */
//			UKTools.published(gameRoom, null, BMDataContext.getContext().getBean(GameRoomRepository.class) , BMDataContext.UserDataEventType.DELETE.toString());
		}
	}
}
