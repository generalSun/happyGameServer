package com.beimi.core.engine.game;

import java.util.ArrayList;
import java.util.List;

import com.beimi.core.BMDataContext;
import com.beimi.util.UKTools;
import com.beimi.cache.CacheHelper;
import com.beimi.client.NettyClients;
import com.beimi.game.rules.model.GamePlayers;
import com.beimi.server.handler.BeiMiClient;
import com.beimi.web.model.GameRoom;
import com.beimi.web.model.PlayUserClient;
import com.beimi.config.game.MsgConstant;

public class EventTools {
	private static EventTools instance;

	public static EventTools getInstance(){
		if(instance == null){
			instance = new EventTools();
		}
		return instance;
	}


	public void sendEvent(String event, Message message,GameRoom gameRoom){
		message.setCommand(event);
		List<PlayUserClient> players = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi()) ;
		for(PlayUserClient user : players){
			BeiMiClient client = NettyClients.getInstance().getClient(user.getId()) ;
			if(client!=null && online(user.getId(), user.getOrgi())){
				client.sendEvent(MsgConstant.s2c_msg.COMMAND.toString(), message);
			}
		}
	}

	public void sendEvent(String event, String userid, Message message){
		if(message!=null) {
			message.setCommand(event);
			BeiMiClient client = NettyClients.getInstance().getClient(userid) ;
			if(client!=null){
				if(online(userid , client.getOrgi())){
					client.sendEvent(MsgConstant.s2c_msg.COMMAND.toString(), message);
				}
			}
		}
	}

	/**
	 * 发送消息给 玩家
	 * @param beiMiClient
	 * @param event
	 * @param gameRoom
	 */
	public void sendPlayers(BeiMiClient beiMiClient , GameRoom gameRoom){
		if(online(beiMiClient.getUserid() , beiMiClient.getOrgi())){
			beiMiClient.sendEvent(MsgConstant.s2c_msg.COMMAND.toString(), new GamePlayers(gameRoom.getPlayers() , CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), beiMiClient.getOrgi()), MsgConstant.s2c_msg.PLAYERS.toString()));
		}
	}
	
	/**
	 * 检查玩家是否在线
	 * @param userid
	 * @param orgi
	 * @return
	 */
	public boolean online(String userid,  String orgi){
		PlayUserClient playerUserClient = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userid, orgi) ;
		return playerUserClient!=null && !BMDataContext.PlayerTypeEnum.OFFLINE.toString().equals(playerUserClient.getPlayertype()) && !BMDataContext.PlayerTypeEnum.LEAVE.toString().equals(playerUserClient.getPlayertype()) ;
	}

	/**
	 * 玩家加入房间
	 * 给自己发送其他玩家列表，给其他玩家发送当前玩家加入
	 * @param beiMiClient
	 * @param userClient
	 * @param gameRoom
	 */
	public void playerJoinRoom(PlayUserClient userClient,GameRoom gameRoom){
		List<PlayUserClient> playerList = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi()) ;
		List<PlayUserClient> otherList = new ArrayList<PlayUserClient>();
		for(PlayUserClient user : playerList){
			BeiMiClient client = NettyClients.getInstance().getClient(user.getId()) ;
			if(client!=null && online(client.getUserid() , client.getOrgi())){
				if(!client.getUserid().equals(userClient.getId())){
					otherList.add(user);
				}
			}
		}
		
		for(PlayUserClient user : playerList){
			BeiMiClient client = NettyClients.getInstance().getClient(user.getId()) ;
			if(client!=null && online(client.getUserid() , client.getOrgi())){
				if(client.getUserid().equals(userClient.getId())){
					if(otherList.size() > 0){
						sendEvent(MsgConstant.s2c_msg.PLAYERS.toString(), userClient.getId(),new GamePlayers(gameRoom.getPlayers(),otherList,MsgConstant.s2c_msg.PLAYERS.toString()));
					}
				}else{
					List<PlayUserClient> list = new ArrayList<PlayUserClient>();
					list.add(userClient);
					sendEvent(MsgConstant.s2c_msg.PLAYERS.toString(),client.getUserid() ,new GamePlayers(gameRoom.getPlayers(),list,MsgConstant.s2c_msg.PLAYERS.toString()));
				}
			}
		}
	}	
	
	/**
	 * 
	 * @param gameRoom
	 * @param players
	 */
	public void sendPlayers(GameRoom gameRoom , List<PlayUserClient> players){
		for(PlayUserClient user : players){
			BeiMiClient client = NettyClients.getInstance().getClient(user.getId()) ;
			if(client!=null && online(client.getUserid() , client.getOrgi())){
				client.sendEvent(MsgConstant.s2c_msg.COMMAND.toString(), new GamePlayers(gameRoom.getPlayers() , CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), client.getOrgi()), MsgConstant.s2c_msg.PLAYERS.toString()));
			}
		}
	}
	
	/**
	 * 发送消息给 玩家
	 * @param beiMiClient
	 * @param event
	 * @param gameRoom
	 */
	public void sendEvent(PlayUserClient playerUser  , Message message){
		if(online(playerUser.getId() , playerUser.getOrgi())){
			NettyClients.getInstance().sendGameEventMessage(playerUser.getId(),MsgConstant.s2c_msg.COMMAND.toString(), message);
		}
	}
	
	/**
	 * 发送消息给 玩家
	 * @param beiMiClient
	 * @param event
	 * @param gameRoom
	 */
	public void sendEvent(String userid  , Message message){
		BeiMiClient client = NettyClients.getInstance().getClient(userid) ;
		if(client!=null && online(userid , client.getOrgi())){
			NettyClients.getInstance().sendGameEventMessage(userid,MsgConstant.s2c_msg.COMMAND.toString(), message);
		}
	}
	
	public PlayUserClient getPlayUserClient(String roomid,String player , String orgi){
		PlayUserClient playUserClient = null;
		List<PlayUserClient> players = CacheHelper.getGamePlayerCacheBean().getCacheObject(roomid, orgi) ;
		for(PlayUserClient user : players){
			if(player.equals(user.getId())){
				playUserClient = user ;
			}
		}
		return playUserClient;
	}
	
	public Object json(Object data){
		return UKTools.json(data) ;
	}
}
