
package com.beimi.server.handler;

import java.io.IOException;
import java.nio.ByteBuffer;

import org.apache.commons.lang.StringUtils;
import org.tio.core.Aio;
import org.tio.core.ChannelContext;
import org.tio.http.common.HttpRequest;
import org.tio.http.common.HttpResponse;
import org.tio.websocket.common.WsRequest;
import org.tio.websocket.server.handler.IWsMsgHandler;

import com.alibaba.fastjson.JSON;
import com.beimi.config.game.GameServer;
import com.beimi.core.BMDataContext;
import com.beimi.game.GameUtils;
import com.beimi.util.UKTools;
import com.beimi.cache.CacheHelper;
import com.beimi.client.NettyClients;
import com.beimi.game.rules.model.SearchRoom;
import com.beimi.web.model.PlayUserClient;
import com.beimi.web.model.Token;
import com.beimi.web.service.repository.es.PlayUserClientESRepository;
import com.beimi.web.service.repository.jpa.PlayUserClientRepository;
import com.beimi.game.majiang.MajiangUtils;
import com.beimi.game.dizhu.DizhuUtils;
import com.beimi.config.game.MsgConstant;

public class GameEventHandler implements IWsMsgHandler
{  
	protected GameServer server;
    /**
	 * 握手时走这个方法，业务可以在这里获取cookie，request参数等
	 */
	@Override
	public HttpResponse handshake(HttpRequest request, HttpResponse httpResponse, ChannelContext channelContext) throws Exception {
		String userid = request.getParam("userid") ;
		if(!StringUtils.isBlank(userid)) {
			channelContext.setAttribute(userid, userid);
            //绑定用户ID
            Aio.bindUser(channelContext, userid);
		}
		return httpResponse;
	}

	/**
	 * 字节消息（binaryType = arraybuffer）过来后会走这个方法
	 */
	@Override
	public Object onBytes(WsRequest wsRequest, byte[] bytes, ChannelContext channelContext) throws Exception {
		channelContext.getClientNode().getIp();
		ByteBuffer buffer = ByteBuffer.allocate(1);
		return buffer;
	}
	
	/**
	 * 字符消息（binaryType = blob）过来后会走这个方法
	 */
	@Override
	public Object onText(WsRequest wsRequest, String text, ChannelContext channelContext) throws Exception {
		if(text!=null) {
			BeiMiClient beiMiClient = JSON.parseObject(text , BeiMiClient.class) ;
			if(!StringUtils.isBlank(beiMiClient.getCommand())) {
				beiMiClient.setServer(this.server);
				String code = beiMiClient.getCommand();
				if(code.equals(MsgConstant.c2s_msg.JOINROOM.toString())){
					this.onJoinRoom(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.GAMESTATUS.toString())){
					this.onGameStatus(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.DOCATCH.toString())){
					this.onCatch(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.GIVEUP.toString())){
					this.onGiveup(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.CARDTIPS.toString())){
					this.onCardTips(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.DOPLAYCARDS.toString())){
					this.onPlayCards(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.NOCARDS.toString())){
					this.onNoCards(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.SELECTCOLOR.toString())){
					this.onSelectColor(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.SELECTACTION.toString())){
					this.onActionEvent(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.RESTART.toString())){
					this.onRestart(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.START.toString())){
					this.onStart(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.RECOVERY.toString())){
					this.onRecovery(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.LEAVE.toString())){
					this.onLeave(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.COMMAND.toString())){
					this.onCommand(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.SEARCHROOM.toString())){
					this.onSearchRoom(beiMiClient);
				}else if(code.equals(MsgConstant.c2s_msg.MESSAGE.toString())){
					this.onMessage(beiMiClient);
				}
			}
		}
		return null;
	}
	
	/**
	 * 当客户端 玩家离线 发close flag时，会走这个方法
	 */
	@Override
	public Object onClose(WsRequest wsRequest, byte[] bytes, ChannelContext channelContext) throws Exception {
		Aio.remove(channelContext, "receive close flag");
		BeiMiClient beiMiClient = NettyClients.getInstance().getClient(channelContext.getUserid()) ;
    	if(beiMiClient!=null){
			NettyClients.getInstance().removeClient(channelContext.getUserid());
			BMDataContext.getGameEngine().closeSocketReq(beiMiClient);
    	}
		return null;
	}

  	//加入房间
    public void onJoinRoom(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken ;
			if(beiMiClient!=null && !StringUtils.isBlank(token) && (userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, beiMiClient.getOrgi()))!=null){
				PlayUserClient userClient = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
				if(userClient == null){
					return;
				}
				beiMiClient.setUserid(userClient.getId());
				beiMiClient.setTime(System.currentTimeMillis());
				NettyClients.getInstance().putClient(userClient.getId(), beiMiClient);
				UKTools.published(userClient,BMDataContext.getContext().getBean(PlayUserClientESRepository.class), BMDataContext.getContext().getBean(PlayUserClientRepository.class));
				BMDataContext.getGameEngine().joinRoomReq(userToken.getUserid(), beiMiClient.getPlayway(), beiMiClient.getRoom(), beiMiClient.getOrgi(), userClient , beiMiClient) ;
			}
		}
    }
    
  	//玩家状态
    public void onGameStatus(BeiMiClient beiMiClient) throws IOException  
    {  
		if(beiMiClient != null){
			String token = beiMiClient.getToken();
			if(StringUtils.isBlank(token)){
				return;
			}
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, beiMiClient.getOrgi());
			BMDataContext.getGameEngine().gameStatusReq(userToken,beiMiClient.getUserid());
		}
    }
      
    //抢地主事件
    public void onCatch(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				PlayUserClient playUser = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
				if(playUser != null){
					String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(playUser.getId(), playUser.getOrgi()) ;
					DizhuUtils.getInstance().actionRequest(roomid, playUser, playUser.getOrgi(), true);
				}
			}
		}
    }
    
    //不抢/叫地主事件
    public void onGiveup(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				PlayUserClient playUser = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
				if(playUser != null){
					String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(playUser.getId(), playUser.getOrgi()) ;
					DizhuUtils.getInstance().actionRequest(roomid, playUser, playUser.getOrgi(), false);
				}
			}
		}
    }
    
  	//不抢/叫地主事件
    public void onCardTips(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				PlayUserClient playUser = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
				if(playUser != null){
					String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(playUser.getId(), playUser.getOrgi()) ;
					DizhuUtils.getInstance().cardTips(roomid, playUser, playUser.getOrgi(), beiMiClient.getData());
				}
			}
		}
    }
    
    //出牌
    public void onPlayCards(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token) && !StringUtils.isBlank(beiMiClient.getData())){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
				String[] cards = beiMiClient.getData().split(",") ;
				
				byte[] playCards = new byte[cards.length] ;
				for(int i= 0 ; i<cards.length ; i++){
					playCards[i] = Byte.parseByte(cards[i]) ;
				}
				BMDataContext.getGameEngine().takeCardsRequest(roomid, userToken.getUserid(), userToken.getOrgi() , false , playCards);
			}
		}
    }
    
    //出牌
    public void onNoCards(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				PlayUserClient playUser = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
				String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(playUser.getId(), playUser.getOrgi()) ;
				BMDataContext.getGameEngine().takeCardsRequest(roomid, userToken.getUserid(), userToken.getOrgi() , false , null);
			}
		}
    }
    
    //出牌
    public void onSelectColor(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				PlayUserClient playUser = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
				String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(playUser.getId(), playUser.getOrgi()) ;
				MajiangUtils.getInstance().selectColorRequest(roomid, playUser.getId(), userToken.getOrgi() , beiMiClient.getData());
			}
		}
    }
    
    //出牌
    public void onActionEvent(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				PlayUserClient playUser = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
				String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(playUser.getId(), playUser.getOrgi()) ;
				MajiangUtils.getInstance().actionEventRequest(roomid, playUser.getId(), userToken.getOrgi() , beiMiClient.getData());
			}
		}
    }
    
    //重新开始
    public void onRestart(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				PlayUserClient playUser = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
				String roomid = (String) CacheHelper.getRoomMappingCacheBean().getCacheObject(playUser.getId(), playUser.getOrgi()) ;
				BMDataContext.getGameEngine().restartRequest(roomid, playUser , beiMiClient , "true".equals(beiMiClient.getData()));
			}
		}
    }
    
  	//开始
    public void onStart(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				PlayUserClient playUser = (PlayUserClient) CacheHelper.getGamePlayerCacheBean().getPlayer(userToken.getUserid(), userToken.getOrgi()) ;
				if(playUser != null){
					BMDataContext.getGameEngine().startGameRequest(playUser.getRoomid(), playUser , userToken.getOrgi() , "true".equals(beiMiClient.getData())) ;
				}
			}
		}
    }
    
    //玩家重连
    public void onRecovery(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				PlayUserClient playUser = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
				if(playUser == null){
					return;
				}
				BMDataContext.getGameEngine().joinRoomReq(playUser.getId(), beiMiClient.getPlayway(), beiMiClient.getRoom(), beiMiClient.getOrgi(), playUser , beiMiClient) ;
			}
		}
    }
    
    //玩家离开
    public void onLeave(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				BMDataContext.getGameEngine().leaveRoomReq(beiMiClient);
			}
		}
    }
    
    //杂七杂八的指令，混合到一起
    public void onCommand(BeiMiClient beiMiClient)  
    {  
    	Command command = JSON.parseObject(beiMiClient.getData() , Command.class) ;
		if(command!=null && !StringUtils.isBlank(command.getToken())){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(command.getToken(), BMDataContext.SYSTEM_ORGI) ;
			PlayUserClient playUser = (PlayUserClient) CacheHelper.getApiUserCacheBean().getCacheObject(userToken.getUserid(), userToken.getOrgi()) ;
			if(userToken!=null){
				switch(command.getCommand()){
					case "subsidy" : GameUtils.subsidyPlayerClient(beiMiClient , playUser, userToken.getOrgi()) ; break ;
				}
			}
		}
    }
    
    //聊天
    public void onMessage(BeiMiClient beiMiClient)  
    {  
    	String token = beiMiClient.getToken();
		if(!StringUtils.isBlank(token)){
			Token userToken = (Token) CacheHelper.getApiUserCacheBean().getCacheObject(token, BMDataContext.SYSTEM_ORGI) ;
			if(userToken!=null){
				
			}
		}
    }
    
    
  //抢地主事件
    public void onSearchRoom(BeiMiClient beiMiClient) throws IOException  
    {  
    	SearchRoom searchRoom = JSON.parseObject(beiMiClient.getData() , SearchRoom.class) ;
    	if(searchRoom!=null && !StringUtils.isBlank(searchRoom.getUserid())){
    		BMDataContext.getGameEngine().searchRoomReq(searchRoom);
    	}
    }

	public GameServer getServer() {
		return server;
	}

	public void setServer(GameServer server) {
		this.server = server;
	}
}  