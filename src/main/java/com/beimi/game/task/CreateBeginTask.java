package com.beimi.game.task;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.cache2k.expiry.ValueWithExpiryTime;

import com.beimi.core.BMDataContext;
import com.beimi.core.engine.game.EventTools;
import com.beimi.config.game.BeiMiGameEvent;
import com.beimi.core.engine.game.BeiMiGameTask;
import com.beimi.core.engine.game.impl.Banker;
import com.beimi.core.engine.game.impl.UserBoard;
import com.beimi.game.GameUtils;
import com.beimi.cache.CacheHelper;
import com.beimi.game.rules.model.Board;
import com.beimi.web.model.GameRoom;
import com.beimi.web.model.PlayUserClient;
import com.beimi.core.engine.game.AbstractTask;
import com.beimi.config.game.MsgConstant;

public class CreateBeginTask extends AbstractTask implements ValueWithExpiryTime  , BeiMiGameTask{

	private long timer  ;
	private GameRoom gameRoom = null ;
	private String orgi ;
	
	public CreateBeginTask(long timer , GameRoom gameRoom, String orgi){
		super();
		this.timer = timer ;
		this.gameRoom = gameRoom ;
		this.orgi = orgi ;
	}
	@Override
	public long getCacheExpiryTime() {
		return System.currentTimeMillis()+timer*1000;	//5秒后执行
	}
	
	public void execute(){
		List<PlayUserClient> playerList = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), orgi) ;
		/**
		 * 顺手 把牌发了，注：此处应根据 GameRoom的类型获取 发牌方式
		 */
		boolean inroom = false;
		if(!StringUtils.isBlank(gameRoom.getLastwinner())){
			for(PlayUserClient player : playerList){
				if(player.getId().equals(gameRoom.getLastwinner())){
					inroom = true ;
				}
			}
		}
		if(inroom == false){
			gameRoom.setLastwinner(playerList.get(0).getId());
		}
		/**
		 * 通知所有玩家 新的庄
		 */
		if(gameRoom.getCode().equals("majiang")){
			EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.BANK.toString(),  new Banker(gameRoom.getLastwinner()), gameRoom);
		}
		Board board = GameUtils.playGame(playerList, gameRoom, gameRoom.getLastwinner(), gameRoom.getCardsnum()) ;
		
		for(Object temp : playerList){
			PlayUserClient playerUser = (PlayUserClient) temp ;
			playerUser.setGamestatus(BMDataContext.GameStatusEnum.PLAYING.toString());
			/**
			 * 更新状态到 PLAYING
			 */
			if(CacheHelper.getApiUserCacheBean().getCacheObject(playerUser.getId(), playerUser.getOrgi())!=null){
				CacheHelper.getApiUserCacheBean().put(playerUser.getId(), playerUser, orgi);
			}
			/**
			 * 每个人收到的 牌面不同，所以不用 ROOM发送广播消息，而是用 遍历房间里所有成员发送消息的方式
			 */
			EventTools.getInstance().sendEvent(playerUser, new UserBoard(board ,gameRoom.getCardsnum(), playerUser.getId() , MsgConstant.s2c_msg.PLAY.toString()));
		}
		
		CacheHelper.getGameRoomCacheBean().put(gameRoom.getId(), gameRoom, gameRoom.getOrgi());
		CacheHelper.getBoardCacheBean().put(gameRoom.getId() , board , orgi) ;
		/**
		 * 发送一个 Begin 事件
		 */
		super.getGame(gameRoom.getPlayway(), orgi).change(gameRoom , BeiMiGameEvent.AUTO.toString() , 2);	//通知状态机 , 此处应由状态机处理异步执行
	}
}
