package com.beimi.game.dizhu.action;

import org.apache.commons.lang3.StringUtils;

import com.beimi.core.BMDataContext;
import com.beimi.game.dizhu.task.CreateAutoTask;
import com.beimi.core.statemachine.action.Action;
import com.beimi.core.statemachine.impl.BeiMiExtentionTransitionConfigurer;
import com.beimi.core.statemachine.message.Message;
import com.beimi.cache.CacheHelper;
import com.beimi.web.model.GameRoom;

/**
 * 凑够了，开牌
 * @author iceworld
 *
 */
public class AutoAction<T,S> implements Action<T, S>{
	@Override
	public void execute(Message<T> message , BeiMiExtentionTransitionConfigurer<T,S> configurer) {
		String room = (String)message.getMessageHeaders().getHeaders().get("room") ;
		if(!StringUtils.isBlank(room)){
			GameRoom gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(room, BMDataContext.SYSTEM_ORGI) ; 
			if(gameRoom!=null){
				int interval = (int) message.getMessageHeaders().getHeaders().get("interval") ;
				CacheHelper.getExpireCache().put(gameRoom.getRoomid(), new CreateAutoTask(interval , gameRoom , gameRoom.getOrgi()));
			}
		}
	}
}
