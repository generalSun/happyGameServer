package com.beimi.game.majiang.action;

import org.apache.commons.lang3.StringUtils;

import com.beimi.core.BMDataContext;
import com.beimi.game.majiang.task.CreateMJPlayCardsTask;
import com.beimi.core.statemachine.action.Action;
import com.beimi.core.statemachine.impl.BeiMiExtentionTransitionConfigurer;
import com.beimi.core.statemachine.message.Message;
import com.beimi.cache.CacheHelper;
import com.beimi.game.rules.model.Board;
import com.beimi.web.model.GameRoom;

/**
 * 凑够了，开牌
 * @author iceworld
 *
 */
public class PlayMJCardsAction<T,S> implements Action<T, S>{
	@Override
	public void execute(Message<T> message , BeiMiExtentionTransitionConfigurer<T,S> configurer) {
		String room = (String)message.getMessageHeaders().getHeaders().get("room") ;
		if(!StringUtils.isBlank(room)){
			GameRoom gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(room, BMDataContext.SYSTEM_ORGI) ; 
			if(gameRoom!=null){
				Board board = (Board) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi()) ;
				int interval = (int) message.getMessageHeaders().getHeaders().get("interval") ;
				String nextPlayer = board.getBanker();
				if(board.getNextplayer() != null && !StringUtils.isBlank(board.getNextplayer().getNextplayer())){
					nextPlayer = board.getNextplayer().getNextplayer() ;
				}
				CacheHelper.getExpireCache().put(gameRoom.getRoomid(), new CreateMJPlayCardsTask(interval , nextPlayer , gameRoom , gameRoom.getOrgi()));
			}
		}
	}
}
