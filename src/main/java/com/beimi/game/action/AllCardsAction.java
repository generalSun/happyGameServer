package com.beimi.game.action;

import org.apache.commons.lang3.StringUtils;

import com.beimi.core.BMDataContext;
import com.beimi.game.task.CreateAllCardsTask;
import com.beimi.core.statemachine.action.Action;
import com.beimi.core.statemachine.impl.BeiMiExtentionTransitionConfigurer;
import com.beimi.core.statemachine.message.Message;
import com.beimi.cache.CacheHelper;
import com.beimi.web.model.GameRoom;

/**
 * 结算
 * @author iceworld
 *
 * @param <T>
 * @param <S>
 */
public class AllCardsAction<T,S> implements Action<T, S>{

	@Override
	public void execute(Message<T> message, BeiMiExtentionTransitionConfigurer<T,S> configurer) {
		String room = (String)message.getMessageHeaders().getHeaders().get("room") ;
		if(!StringUtils.isBlank(room)){
			GameRoom gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(room, BMDataContext.SYSTEM_ORGI) ; 
			if(gameRoom!=null){
				CacheHelper.getExpireCache().put(gameRoom.getRoomid(), new CreateAllCardsTask(0 , gameRoom , gameRoom.getOrgi()));
			}
		}
	}
}
