package com.beimi.game.dizhu.task;

import java.util.List;

import com.beimi.core.BMDataContext;
import com.beimi.config.game.BeiMiGameEvent;
import com.beimi.core.engine.game.BeiMiGameTask;
import com.beimi.core.engine.game.GameBoard;
import com.beimi.core.engine.game.AbstractTask;
import com.beimi.cache.CacheHelper;
import com.beimi.game.dizhu.DiZhuBoard;
import com.beimi.game.rules.model.Player;
import com.beimi.web.model.GameRoom;
import com.beimi.web.model.PlayUserClient;
import com.beimi.config.game.MsgConstant;

/**
 * 抢地主
 * @author iceworld
 *
 */
public class CreateAutoTask extends AbstractTask implements BeiMiGameTask{

	private long timer  ;
	private GameRoom gameRoom = null ;
	private String orgi ;
	
	public CreateAutoTask(long timer , GameRoom gameRoom, String orgi){
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
		DiZhuBoard board = (DiZhuBoard) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi());
		if(board == null){
			return;
		}
		int index = board.getDzCardPlayerIndex();
		Player randomCardPlayer = board.getDzCardPlayer() , catchPlayer = null;
		if(randomCardPlayer.isDocatch()){
			catchPlayer = board.next(index);
		}else{
			catchPlayer = randomCardPlayer;
		}
		if(catchPlayer != null){
			sendEvent(MsgConstant.s2c_msg.CATCH.toString(), new GameBoard(catchPlayer.getPlayuser() , board.isDocatch() , catchPlayer.isAccept() , board.getRatio()), gameRoom) ;
			boolean isNormal = true ;
			List<PlayUserClient> users = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), orgi) ;
			for(PlayUserClient playUser : users){
				if(catchPlayer.getPlayuser().equals(playUser.getId())){
					if(!playUser.getPlayertype().equals(BMDataContext.PlayerTypeEnum.NORMAL.toString())){
						//AI或托管，自动抢地主，后台配置 自动抢地主的触发时间，或者 抢还是不抢， 无配置的情况下，默认的是抢地主
						isNormal = false ;
						break ;
					}
				}
			}
			CacheHelper.getBoardCacheBean().put(gameRoom.getId(), board, orgi);
			if(isNormal){	//真人
				super.getGame(gameRoom.getPlayway(), orgi).change(gameRoom , BeiMiGameEvent.CATCH.toString() , 17);	//通知状态机 , 此处应由状态机处理异步执行
			}else{			//AI或托管
				super.getGame(gameRoom.getPlayway(), orgi).change(gameRoom , BeiMiGameEvent.CATCH.toString() , 2);	//通知状态机 , 此处应由状态机处理异步执行
			}
		}else{
			int catchfailTimes = gameRoom.getCatchfailTimes();
			gameRoom.setCatchfailTimes(catchfailTimes+1);
			if(catchfailTimes < 2){
				sendEvent(MsgConstant.s2c_msg.CATCHFAIL.toString(),new GameBoard(null,  board.getRatio()), gameRoom) ;   //通知客户端流局了
				CacheHelper.getBoardCacheBean().delete(gameRoom.getId(), orgi);  //删除board ，重新发牌时会重新产生一个新的
				CacheHelper.getGameRoomCacheBean().put(gameRoom.getId(), gameRoom, gameRoom.getOrgi());
				super.getGame(gameRoom.getPlayway(), orgi).change(gameRoom, BeiMiGameEvent.ENOUGH.toString(), 5);    //跳回前一个状态 ，重新发牌
			}else{
				board.setBanker(randomCardPlayer.getPlayuser());
				CacheHelper.getBoardCacheBean().put(gameRoom.getId(), board, orgi);
				super.getGame(gameRoom.getPlayway(), orgi).change(gameRoom , BeiMiGameEvent.RAISEHANDS.toString() , 1);
			}
		}
	}
}
