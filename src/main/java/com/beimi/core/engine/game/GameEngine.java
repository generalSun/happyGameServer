package com.beimi.core.engine.game;

import java.util.List;
import java.util.Date;
import javax.annotation.Resource;
import org.kie.api.runtime.KieSession;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import com.beimi.util.RandomCharUtil;
import com.beimi.util.UKTools;
import com.beimi.core.BMDataContext;
import com.beimi.game.GameUtils;
import com.beimi.server.handler.BeiMiClient;
import com.beimi.cache.CacheHelper;
import com.beimi.game.rules.model.Board;
import com.beimi.game.rules.model.Player;
import com.beimi.game.rules.model.TakeCards;
import com.beimi.web.service.repository.jpa.GameRoomRepository;
import com.beimi.web.model.GamePlayway;
import com.beimi.web.model.GameRoom;
import com.beimi.web.model.PlayUserClient;
import com.beimi.web.service.repository.es.PlayUserClientESRepository;
import com.beimi.game.rules.model.SearchRoom;
import com.beimi.web.model.Token;
import com.beimi.core.engine.game.RoomTools;
import com.beimi.config.game.BeiMiGameEnum;

@Service(value="beimiGameEngine")
public class GameEngine {

	@Resource
	private KieSession kieSession;

	public void searchRoomReq(SearchRoom searchRoom){
		GameRoom gameRoom = null ;
		
		GameRoomRepository gameRoomRepository = BMDataContext.getContext().getBean(GameRoomRepository.class);
		PlayUserClient playUser = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(searchRoom.getUserid(), searchRoom.getOrgi()) ;
		if(playUser == null){
			return;
		}
		String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(playUser.getId(), playUser.getOrgi()) ;
		if(!StringUtils.isBlank(roomid)){
			gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, playUser.getOrgi()) ;
		}else{
			List<GameRoom> gameRoomList = gameRoomRepository.findByRoomidAndOrgi(searchRoom.getRoomid(), playUser.getOrgi()) ;
			if(gameRoomList!=null && gameRoomList.size() > 0){
				GameRoom tempGameRoom = gameRoomList.get(0) ;
				gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(tempGameRoom.getId(), playUser.getOrgi()) ;
			}
		}
		RoomTools.getInstance().searchRoom(playUser,gameRoom);
	}
	
	public void joinRoomReq(String userid ,String playway , String room , String orgi , PlayUserClient userClient , BeiMiClient beiMiClient){
		GamePlayway gamePlayway = (GamePlayway) CacheHelper.getSystemCacheBean().getCacheObject(playway, orgi) ;
		if(gamePlayway == null){
			return;
		}
		GameRoom gameRoom = RoomTools.getInstance().whichRoom(userid, orgi) ;
		if(gameRoom == null){
			if(beiMiClient.getExtparams() == null){	
				gameRoom = creatGameRoom(gamePlayway, userid , true , beiMiClient) ;
			}else{
				if("true".equals(beiMiClient.getExtparams().get("automatch"))){
					gameRoom = (GameRoom) CacheHelper.getQueneCache().poll(playway , orgi) ;
				}else if(beiMiClient.getData() != null){
					String room_id = (String) beiMiClient.getData();
					gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(room_id, orgi) ;
				}
				
				if(gameRoom == null){
					gameRoom = creatGameRoom(gamePlayway, userid , false , beiMiClient) ;
				}
			}
		}
		if(gameRoom == null){
			return;
		}
		boolean flag = RoomTools.getInstance().joinRoom(gameRoom, userClient,BMDataContext.PlayerTypeEnum.NORMAL.toString());
		if(flag == false){
			boolean isRecovery = RoomTools.getInstance().recoveryRoom(gameRoom,userClient,BMDataContext.PlayerTypeEnum.NORMAL.toString());
			if(isRecovery == true){
				CacheHelper.getApiUserCacheBean().put(userid,userClient , orgi);
			}
		}else{
			CacheHelper.getApiUserCacheBean().put(userid,userClient , orgi);
			RoomTools.getInstance().roomReady(gameRoom);
		}
	}

	public void gameStatusReq(Token userToken,String id){
		RoomTools.getInstance().statusRoom(userToken,id);
	}

	public void closeSocketReq(BeiMiClient beiMiClient){
		PlayUserClient playUserClient = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(beiMiClient.getUserid(), beiMiClient.getOrgi()) ;
		if(playUserClient != null){
			playUserClient.setOnline(false);
			GameRoom gameRoom = RoomTools.getInstance().whichRoom(beiMiClient.getUserid(), beiMiClient.getOrgi());
			if(gameRoom != null){
				if(BMDataContext.GameStatusEnum.PLAYING.toString().equals(playUserClient.getGamestatus())){
					RoomTools.getInstance().leaveRoom(playUserClient, beiMiClient.getOrgi());
				}else{
					RoomTools.getInstance().closeRoom(playUserClient, beiMiClient.getOrgi());
				}
			}else{
				CacheHelper.getApiUserCacheBean().delete(beiMiClient.getUserid(), beiMiClient.getOrgi()) ;
			}
		}
	}

	public void leaveRoomReq(BeiMiClient beiMiClient){
		PlayUserClient playUserClient = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(beiMiClient.getUserid(), beiMiClient.getOrgi()) ;
		if(playUserClient != null){
			playUserClient.setOnline(false);
			playUserClient.setPlayertype(BMDataContext.PlayerTypeEnum.LEAVE.toString());
			GameRoom gameRoom = RoomTools.getInstance().whichRoom(beiMiClient.getUserid(), beiMiClient.getOrgi());
			if(gameRoom != null){
				RoomTools.getInstance().leaveRoom(playUserClient);
			}
		}
	}

	/**
	 * 开始游戏
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
			RoomTools.getInstance().playerReady(playUser,gameRoom,GameUtils.getGame(gameRoom.getPlayway() , gameRoom.getOrgi()));
			UKTools.published(playUser,BMDataContext.getContext().getBean(PlayUserClientESRepository.class));
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
		GameRoom gameRoom = RoomTools.getInstance().whichRoom(playerUser.getId(), playerUser.getOrgi());
		if(gameRoom != null){
			playerList = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi()) ;
			if(playerList!=null && playerList.size() > 0){
				for(PlayUserClient player : playerList){
					if(player.isRoomready() == false){
						notReady = true ; break ;
					}
				}
			}
		}
		if(notReady == true && gameRoom!=null){
			startGameRequest(roomid, playerUser, playerUser.getOrgi(), opendeal);
		}else if(playerList == null || playerList.size() == 0 || gameRoom == null){//房间已解散
			joinRoomReq(playerUser.getId(), beiMiClient.getPlayway(), beiMiClient.getRoom(), beiMiClient.getOrgi(), playerUser , beiMiClient) ;
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
	 * 创建新房间 ，需要传入房间的玩法 ， 玩法定义在 系统运营后台，玩法创建后，放入系统缓存 ， 客户端进入房间的时候，传入 玩法ID参数
	 * @param playway
	 * @param userid
	 * @return
	 */
	private GameRoom creatGameRoom(GamePlayway playway , String userid , boolean cardroom , BeiMiClient beiMiClient){
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
	
}
