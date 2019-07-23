package com.beimi.core.engine.game;

import java.util.Date;
import java.util.List;

import javax.annotation.Resource;

import org.apache.commons.lang3.StringUtils;
import org.kie.api.runtime.KieSession;
import org.springframework.stereotype.Service;

import com.beimi.config.game.BeiMiGameEvent;
import com.beimi.config.game.BeiMiGameEnum;
import com.beimi.core.BMDataContext;
import com.beimi.core.engine.game.state.GameEvent;
import com.beimi.game.GameUtils;
import com.beimi.util.RandomCharUtil;
import com.beimi.util.UKTools;
import com.beimi.cache.CacheHelper;
import com.beimi.client.NettyClients;
import com.beimi.game.rules.model.Board;
import com.beimi.game.rules.model.JoinRoom;
import com.beimi.game.rules.model.Player;
import com.beimi.game.rules.model.Playeready;
import com.beimi.game.rules.model.RecoveryData;
import com.beimi.game.rules.model.TakeCards;
import com.beimi.server.handler.BeiMiClient;
import com.beimi.web.model.GamePlayway;
import com.beimi.web.model.GameRoom;
import com.beimi.web.model.PlayUserClient;
import com.beimi.web.service.repository.es.PlayUserClientESRepository;
import com.beimi.web.service.repository.jpa.GameRoomRepository;
import com.beimi.config.game.Game;
import com.beimi.game.rules.model.RoomReady;
@Service(value="beimiGameEngine")
public class GameEngine {

	@Resource
	private KieSession kieSession;
	
	public void gameRequest(String userid ,String playway , String room , String orgi , PlayUserClient userClient , BeiMiClient beiMiClient ){
		GameEvent gameEvent = gameRequest(userClient.getId(), beiMiClient.getPlayway(), beiMiClient, beiMiClient.getOrgi(), userClient) ;
		if(gameEvent != null){
			/**
			 * 举手了，表示游戏可以开始了
			 */
			if(userClient!=null){
				userClient.setGamestatus(BMDataContext.GameStatusEnum.READY.toString());
			}
			/**
			 * 游戏状态 ， 玩家请求 游戏房间，活动房间状态后，发送事件给 StateMachine，由 StateMachine驱动 游戏状态 ， 此处只负责通知房间内的玩家
			 * 1、有新的玩家加入
			 * 2、给当前新加入的玩家发送房间中所有玩家信息（不包含隐私信息，根据业务需求，修改PlayUserClient的字段，剔除掉隐私信息后发送）
			 */
			EventTools.getInstance().sendEvent("joinroom", userClient.getId(),new JoinRoom(userClient, gameEvent.getIndex(), gameEvent.getGameRoom().getPlayers() , gameEvent.getGameRoom()));
			EventTools.getInstance().playerJoinRoom(beiMiClient,userClient, gameEvent.getGameRoom());
			/**
			 * 当前是在游戏中还是 未开始
			 */
			Board board = (Board) CacheHelper.getBoardCacheBean().getCacheObject(gameEvent.getRoomid(), gameEvent.getOrgi());
			if(board !=null){
				Player currentPlayer = null;
				for(Player player : board.getPlayers()){
					if(player.getPlayuser().equals(userClient.getId())){
						currentPlayer = player ; break ;
					}
				}
				if(currentPlayer!=null){
					boolean automic = false ;
					if((board.getLast()!=null && board.getLast().getUserid().equals(currentPlayer.getPlayuser())) || (board.getLast() == null && board.getBanker().equals(currentPlayer.getPlayuser()))){
						automic = true ;
					}
					EventTools.getInstance().sendEvent("recovery", new RecoveryData(currentPlayer , board.getLasthands() , board.getNextplayer()!=null ? board.getNextplayer().getNextplayer() : null , 25 , automic , board,gameEvent.getGameRoom()) , gameEvent.getGameRoom());
				}
			}else{
				//通知状态
				GameUtils.getGame(beiMiClient.getPlayway() , gameEvent.getOrgi()).change(gameEvent);	//通知状态机 , 此处应由状态机处理异步执行
			}
		}
	}
	
	/**
	 * 玩家房间选择， 新请求，游戏撮合， 如果当前玩家是断线重连， 或者是 退出后进入的，则第一步检查是否已在房间
	 * 如果已在房间，直接返回
	 * @param userid
	 * @param orgi
	 * @return
	 */
	public GameEvent gameRequest(String userid ,String playway , BeiMiClient beiMiClient , String orgi , PlayUserClient playUser){
		GameEvent gameEvent = null ;
		String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(userid, orgi) ;
		GamePlayway gamePlayway = (GamePlayway) CacheHelper.getSystemCacheBean().getCacheObject(playway, orgi) ;
		boolean needtakequene = false;
		if(gamePlayway!=null){
			gameEvent = new GameEvent(gamePlayway.getPlayers() , gamePlayway.getCardsnum() , orgi) ;
			GameRoom gameRoom = null ;
			if(!StringUtils.isBlank(roomid) && CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, orgi)!=null){//
				gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, orgi) ;		//直接加入到 系统缓存 （只有一个地方对GameRoom进行二次写入，避免分布式锁）
			}else{
				// if(beiMiClient.getExtparams()!=null && BMDataContext.BEIMI_SYSTEM_ROOM.equals(beiMiClient.getExtparams().get("gamemodel"))){	//房卡游戏 , 创建ROOM
				if(beiMiClient.getExtparams() == null){	
					gameRoom = this.creatGameRoom(gamePlayway, userid , true , beiMiClient) ;
				}else{	//
					/**
					 * 大厅游戏 ， 撮合游戏 , 发送异步消息，通知RingBuffer进行游戏撮合，撮合算法描述如下：
					 */
					if("true".equals(beiMiClient.getExtparams().get("automatch"))){
						gameRoom = (GameRoom) CacheHelper.getQueneCache().poll(playway , orgi) ;
					}else if(beiMiClient.getData() != null){
						String room_id = (String) beiMiClient.getData();
						gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(room_id, orgi) ;
					}
					if(gameRoom != null){	
						/**
						 * 修正获取gameroom获取的问题，因为删除房间的时候，为了不损失性能，没有将 队列里的房间信息删除，如果有玩家获取到这个垃圾信息
						 * 则立即进行重新获取房间， 
						 */
						while(CacheHelper.getGameRoomCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi()) == null){
							if("true".equals(beiMiClient.getExtparams().get("automatch"))){
								gameRoom = (GameRoom) CacheHelper.getQueneCache().poll(playway , orgi) ;
							}
							if(gameRoom == null){
								break ;
							}
						}
					}
					
					if(gameRoom==null){	//无房间 ， 需要
						gameRoom = this.creatGameRoom(gamePlayway, userid , false , beiMiClient) ;
					}else if(gameRoom.getExtparams() != null && "true".equals(gameRoom.getExtparams().get("automatch"))){
						playUser.setPlayerindex(System.currentTimeMillis());//从后往前坐，房主进入以后优先坐在 首位
						needtakequene =  true ;
					}
				}
			}
			if(gameRoom!=null){
				/**
				 * 设置游戏当前已经进行的局数
				 */
				gameRoom.setCurrentnum(0);
				/**
				 * 更新缓存
				 */
				CacheHelper.getGameRoomCacheBean().put(gameRoom.getId(), gameRoom, orgi);
				/**
				 * 如果当前房间到达了最大玩家数量，则不再加入到 撮合队列
				 */
				List<PlayUserClient> playerList = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi()) ;
				if(playerList.size() == 0){
					gameEvent.setEvent(BeiMiGameEvent.ENTER.toString());
				}else{	
					gameEvent.setEvent(BeiMiGameEvent.JOIN.toString());
				}
				gameEvent.setGameRoom(gameRoom);
				gameEvent.setRoomid(gameRoom.getId());
				
				/**
				 * 无条件加入房间
				 */
				this.joinRoom(gameRoom, playUser, playerList);
				
				for(PlayUserClient temp : playerList){
					if(temp.getId().equals(playUser.getId())){
						gameEvent.setIndex(playerList.indexOf(temp)); break ;
					}
				}
				/**
				 * 如果当前房间到达了最大玩家数量，则不再加入到 撮合队列
				 */
				if(playerList.size() < gamePlayway.getPlayers() && needtakequene == true){
					CacheHelper.getQueneCache().put(gameRoom, orgi);	//未达到最大玩家数量，加入到游戏撮合 队列，继续撮合
				}
				
			}
		}
		return gameEvent;
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
	 * 抢地主，斗地主
	 * @param roomid

	 * @param orgi
	 * @return
	 */
	public void startGameRequest(String roomid, PlayUserClient playUser, String orgi , boolean opendeal){
		GameRoom gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, orgi) ;
		if(gameRoom!=null){
			playUser.setRoomready(true);
			if(opendeal == true){
				playUser.setOpendeal(opendeal);
			}
			CacheHelper.getGamePlayerCacheBean().put(playUser.getId(), playUser, playUser.getOrgi());
			roomReady(gameRoom, GameUtils.getGame(gameRoom.getPlayway() , gameRoom.getOrgi()));
			UKTools.published(playUser,BMDataContext.getContext().getBean(PlayUserClientESRepository.class));
			EventTools.getInstance().sendEvent("playeready", new Playeready(playUser.getId() , "playeready") , gameRoom);
		}
	}
	
	/**
	 * 出牌，并校验出牌是否合规
	 * @param roomid
	 * 
	 * @param auto 是否自动出牌，超时/托管/AI会调用 = true

	 * @param orgi
	 * @return
	 */
	public TakeCards takeCardsRequest(String roomid, String playUserClient, String orgi , boolean auto , byte[] playCards){
		TakeCards takeCards = null ;
		GameRoom gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, orgi) ;
		if(gameRoom!=null){
			Board board = (Board) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi());
			if(board!=null){
				Player player = board.player(playUserClient) ;
				if(board.getNextplayer()!=null && player.getPlayuser().equals(board.getNextplayer().getNextplayer()) && board.getNextplayer().isTakecard() == false){
					takeCards = board.takeCardsRequest(gameRoom, board, player, orgi, auto, playCards) ;
				}
			}
		}
		return takeCards ;
	}
	
	/**
	 * 检查是否所有玩家 都已经处于就绪状态，如果所有玩家都点击了 继续开始游戏，则发送一个 ALL事件，继续游戏，
	 * 否则，等待10秒时间，到期后如果玩家还没有就绪，就将该玩家T出去，等待新玩家加入
	 * @param roomid
	 * @param userid
	 * @param orgi
	 * @return
	 */
	public void restartRequest(String roomid , PlayUserClient playerUser, BeiMiClient beiMiClient , boolean opendeal){
		boolean notReady = false ;
		List<PlayUserClient> playerList = null ;
		GameRoom gameRoom = null ;
		if(!StringUtils.isBlank(roomid)){
			gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, playerUser.getOrgi()) ;
			playerList = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi()) ;
			if(playerList!=null && playerList.size() > 0){
				/**
				 * 有一个 等待 
				 */
				for(PlayUserClient player : playerList){
					if(player.isRoomready() == false){
						notReady = true ; break ;
					}
				}
			}
		}
		if(notReady == true && gameRoom!=null){
			/**
			 * 需要增加一个状态机的触发事件：等待其他人就绪，超过5秒以后未就绪的，直接踢掉，然后等待机器人加入
			 */
			this.startGameRequest(roomid, playerUser, playerUser.getOrgi(), opendeal);
		}else if(playerList == null || playerList.size() == 0 || gameRoom == null){//房间已解散
			BMDataContext.getGameEngine().gameRequest(playerUser.getId(), beiMiClient.getPlayway(), beiMiClient.getRoom(), beiMiClient.getOrgi(), playerUser , beiMiClient) ;
			/**
			 * 结算后重新开始游戏
			 */
			playerUser.setRoomready(true);
			CacheHelper.getGamePlayerCacheBean().put(playerUser.getId(), playerUser, playerUser.getOrgi());
		}
	}
	
	/**
	 * 出牌，不出牌
	 * @param roomid

	 * @param orgi
	 * @return
	 */
	public void noCardsRequest(String roomid, PlayUserClient playUser, String orgi){
		
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
