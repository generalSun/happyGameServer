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
import com.beimi.game.rules.model.SearchRoomResult;
import com.beimi.core.engine.game.EventTools;
import com.beimi.game.rules.model.JoinRoom;
import com.beimi.game.rules.model.Board;
import com.beimi.game.rules.model.Player;
import com.beimi.game.rules.model.RecoveryData;
import com.beimi.game.rules.model.GameStatus;
import com.beimi.web.model.Token;
import com.beimi.game.GameUtils;
import com.beimi.config.game.MsgConstant;
import com.beimi.game.rules.model.Playeready;

public class RoomTools {
	private static RoomTools instance;

	public static RoomTools getInstance(){
		if(instance == null){
			instance = new RoomTools();
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
	public void playerReady(PlayUserClient playUser, GameRoom gameRoom){
		Playeready ready = new Playeready(playUser.getId(),MsgConstant.s2c_msg.PLAYEREADY.toString());
		EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.PLAYEREADY.toString(),ready, gameRoom);
	}

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
			EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.ROOMREADY.toString(), new RoomReady(gameRoom), gameRoom);
		}else{
			gameRoom.setStatus(BeiMiGameEnum.WAITTING.toString());
		}
		CacheHelper.getGameRoomCacheBean().put(gameRoom.getId(), gameRoom, gameRoom.getOrgi());
		if(enough == true){
			game.change(gameRoom , BeiMiGameEvent.ENOUGH.toString());	//通知状态机 , 此处应由状态机处理异步执行
		}
	}

	/**
	* 玩家加入房间
	* @param gameRoom
	* @param playUser
	*/
	public boolean joinRoom(GameRoom gameRoom , PlayUserClient playUser,String playType){
		List<PlayUserClient> playerList = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi()) ;
		if(playerList.size() >= gameRoom.getPlayers()){
			EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.JOINROOM.toString(), playUser.getId(),new JoinRoom(BMDataContext.JoinRoomResultType.FULL.toString()));
			return false;
		}
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
			playUser.setOnline(true);
			playUser.setPlayertype(playType);
			playerList.add(playUser) ;
			playUser.setServerIndex(playerList.indexOf(playUser));
			NettyClients.getInstance().joinRoom(playUser.getId(), gameRoom.getId());
			CacheHelper.getGamePlayerCacheBean().put(playUser.getId(), playUser, playUser.getOrgi()); //将用户加入到 room ， MultiCache
			gameRoom.setCurrentnum(0);
			CacheHelper.getGameRoomCacheBean().put(gameRoom.getId(), gameRoom, playUser.getOrgi());
			CacheHelper.getRoomMappingCacheBean().put(playUser.getId(), gameRoom.getId(), playUser.getOrgi());
			JoinRoom join = new JoinRoom(playUser, playerList.indexOf(playUser), gameRoom.getPlayers(),gameRoom,BMDataContext.JoinRoomResultType.OK.toString());
			EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.JOINROOM.toString(), playUser.getId(),join);
			EventTools.getInstance().playerJoinRoom(playUser, gameRoom);
			return true;
		}
		CacheHelper.getRoomMappingCacheBean().put(playUser.getId(), gameRoom.getId(), playUser.getOrgi());
		return false;
	}
	
	/**
	* 恢复房间
	* @param gameRoom
	* @param userClient
	* @return
	*/
	public boolean recoveryRoom(GameRoom gameRoom, PlayUserClient userClient,String playType){
		Board board = (Board) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getRoomid(), gameRoom.getOrgi());
		if(board != null){
			Player currentPlayer = null;
			for(Player player : board.getPlayers()){
				if(player.getPlayuser().equals(userClient.getId())){
					currentPlayer = player ; break ;
				}
			}
			if(currentPlayer != null){
				userClient.setPlayertype(playType);
				boolean automic = false ;
				if((board.getLast()!=null && board.getLast().getUserid().equals(currentPlayer.getPlayuser())) || (board.getLast() == null && board.getBanker().equals(currentPlayer.getPlayuser()))){
					automic = true ;
				}
				String nextplayer = board.getNextplayer()!=null ? board.getNextplayer().getNextplayer() : null ;
				RecoveryData recovery = new RecoveryData(currentPlayer , board.getLasthands() ,nextplayer , 25 , automic , board,gameRoom);
				EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.RECOVERY.toString(),userClient.getId() , recovery);
				CacheHelper.getRoomMappingCacheBean().put(userClient.getId(), gameRoom.getId(), userClient.getOrgi());
			}
			return true;
		}
		return false;
	}

	/**
	* 房间状态
	* @param userToken
	* @return
	*/
	public void statusRoom(Token userToken,String userid){
		GameStatus gameStatus = new GameStatus() ;
		gameStatus.setGamestatus(BMDataContext.GameStatusEnum.NOTREADY.toString());
		if(userToken == null){
			gameStatus.setGamestatus(BMDataContext.GameStatusEnum.TIMEOUT.toString());
		}else{
			PlayUserClient userClient = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
			if(userClient != null){
				gameStatus.setGamestatus(BMDataContext.GameStatusEnum.READY.toString());
				GameRoom gameRoom = whichRoom(userid, userClient.getOrgi());
				if(gameRoom != null){
					gameStatus.setUserid(userClient.getId());
					gameStatus.setOrgi(userClient.getOrgi());
		
					GamePlayway gamePlayway = (GamePlayway) CacheHelper.getSystemCacheBean().getCacheObject(gameRoom.getPlayway(), userClient.getOrgi()) ;
					gameStatus.setGametype(gamePlayway.getCode());
					gameStatus.setPlayway(gamePlayway.getId());
					gameStatus.setGamestatus(BMDataContext.GameStatusEnum.PLAYING.toString());
					if(gameRoom.isCardroom()){
						gameStatus.setCardroom(true);
					}
				}
			}
		}
		EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.GAMESTATUS.toString(),userid,gameStatus);
	}
	
	/**
	 * 退出房间
	 * @param playUser
	 * @param orgi
	 * @return
	 */
	public GameRoom leaveRoom(PlayUserClient playUser , String orgi){
		GameRoom gameRoom = whichRoom(playUser.getId(), orgi) ;
		if(gameRoom!=null){
			List<PlayUserClient> players = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), orgi) ;
			if(gameRoom.isCardroom()){
				if(gameRoom.getMaster().equals(playUser.getId())){
					closeRoom(playUser, orgi);
				}
			}else{
				if(players.size() <= 1){
					closeRoom(playUser, orgi);
				}else{
					Player player = new Player(playUser.getId()) ;
					player.setOnline(playUser.isOnline());
					EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.LEAVE.toString(), player,gameRoom);
					playUser.setPlayertype(BMDataContext.PlayerTypeEnum.OFFLINE.toString());
					CacheHelper.getApiUserCacheBean().delete(playUser.getId(), playUser.getOrgi()) ;
					CacheHelper.getGamePlayerCacheBean().delete(playUser.getId(), playUser.getOrgi()) ;
				}
			}
		}
		return gameRoom;
	}

	/**
	 * 离开房间
	 * @param playUser
	 * @param orgi
	 * @return
	 */
	public GameRoom leaveRoom(PlayUserClient playUser){
		GameRoom gameRoom = whichRoom(playUser.getId(), playUser.getOrgi()) ;
		if(gameRoom!=null){
			if(BMDataContext.GameStatusEnum.PLAYING.toString().equals(playUser.getGamestatus())){
				Player player = new Player(playUser.getId()) ;
				player.setResult(1);
				EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.LEAVE.toString(), playUser.getId(),player);
			}else{
				leaveRoom(playUser, playUser.getOrgi());
			}
		}
		return gameRoom;
	}

	/**
	 * 关闭房间
	 * @param playUser
	 * @param orgi
	 * @return
	 */
	public GameRoom closeRoom(PlayUserClient playUser , String orgi){
		GameRoom gameRoom = whichRoom(playUser.getId(), orgi) ;
		if(gameRoom!=null){
			Board board = (Board) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi());
			if(board != null){
				board.setGameOver(true);
			}
			GameUtils.getGame(gameRoom.getPlayway() , gameRoom.getOrgi()).change(gameRoom , BeiMiGameEvent.ALLCARDS.toString() , 1);
		}
		return gameRoom;
	}

	/**
	 * 查找房间
	 * @param orgi
	 * @return
	 */
	public void searchRoom(PlayUserClient playUser,GameRoom gameRoom){
		SearchRoomResult searchRoomResult = null ;
		GamePlayway gamePlayway = null ;
		boolean joinRoom = false;
		if(gameRoom != null){
			gamePlayway = (GamePlayway) CacheHelper.getSystemCacheBean().getCacheObject(gameRoom.getPlayway(), gameRoom.getOrgi()) ;
			List<PlayUserClient> playerList = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi()) ;
			if(playerList.size() < gamePlayway.getPlayers()){
				joinRoom = true ;
			}
		}
		if(gamePlayway!=null){
    		//通知客户端
    		if(joinRoom == true){		//加入成功 ， 是否需要输入加入密码？
    			searchRoomResult = new SearchRoomResult(gamePlayway.getId() , gamePlayway.getCode() ,gameRoom.getId(), BMDataContext.SearchRoomResultType.OK.toString());
    		}else{						//加入失败
    			searchRoomResult = new SearchRoomResult(BMDataContext.SearchRoomResultType.FULL.toString());
    		}
    	}else{ //房间不存在
    		searchRoomResult = new SearchRoomResult(BMDataContext.SearchRoomResultType.NOTEXIST.toString());
    	}
		
    	EventTools.getInstance().sendEvent(BMDataContext.BEIMI_SEARCHROOM_EVENT,playUser.getId(),searchRoomResult);
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
	 * @param roomid
	 * @param orgi
	 * @return
	 */
	public void finishRoom(String roomid, String orgi){
		if(!StringUtils.isBlank(roomid)){
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
	public GameRoom creatGameRoom(GamePlayway playway , String userid , boolean cardroom , BeiMiClient beiMiClient){
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
