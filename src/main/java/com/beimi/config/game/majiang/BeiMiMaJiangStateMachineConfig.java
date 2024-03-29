package com.beimi.config.game.majiang;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.beimi.config.game.BeiMiGameEnum;
import com.beimi.config.game.BeiMiGameEvent;
import com.beimi.game.action.AllCardsAction;
import com.beimi.game.action.EnoughAction;
import com.beimi.game.action.EnterAction;
import com.beimi.game.action.JoinAction;
import com.beimi.game.majiang.action.PlayMJCardsAction;
import com.beimi.game.majiang.action.DealMJCardAction;
import com.beimi.game.majiang.action.MJRaiseHandsAction;
import com.beimi.game.majiang.action.SelectAction;
import com.beimi.core.statemachine.BeiMiStateMachine;
import com.beimi.core.statemachine.config.StateConfigurer;
import com.beimi.core.statemachine.config.StateMachineTransitionConfigurer;

@Configuration
public class BeiMiMaJiangStateMachineConfig<T, S>  {
	
	@Bean("majiang")
	public BeiMiStateMachine<String,String> create() throws Exception{
		BeiMiStateMachine<String,String> beiMiStateMachine = new BeiMiStateMachine<String,String>();
		this.configure(beiMiStateMachine.getConfig());
		this.configure(beiMiStateMachine.getTransitions());
		return beiMiStateMachine;
	}
	
    public void configure(StateConfigurer<String,String> states)
            throws Exception {
        states
            .withStates()
                .initial(BeiMiGameEnum.NONE.toString())
                    .state(BeiMiGameEnum.CRERATED.toString())
                    .state(BeiMiGameEnum.WAITTING.toString())
                    .state(BeiMiGameEnum.READY.toString())
                    .state(BeiMiGameEnum.BEGIN.toString())
                    .state(BeiMiGameEnum.PLAY.toString())
                    .state(BeiMiGameEnum.END.toString());
	}

    public void configure(StateMachineTransitionConfigurer<String, String> transitions)
            throws Exception {
		/**
		 * 状态切换：BEGIN->WAITTING->READY->PLAY->END
		 */
        transitions
	        .withExternal()	
		    	.source(BeiMiGameEnum.NONE.toString()).target(BeiMiGameEnum.CRERATED.toString())
		    	.event(BeiMiGameEvent.ENTER.toString()).action(new EnterAction<String,String>())
		    	.and()
		    .withExternal()	
	        	.source(BeiMiGameEnum.CRERATED.toString()).target(BeiMiGameEnum.WAITTING.toString())
	        	.event(BeiMiGameEvent.JOIN.toString()).action(new JoinAction<String,String>())
	        	.and()
            .withExternal()	
                .source(BeiMiGameEnum.WAITTING.toString()).target(BeiMiGameEnum.READY.toString())
                .event(BeiMiGameEvent.ENOUGH.toString()).action(new EnoughAction<String, String>())
                .and()
            .withExternal()
                .source(BeiMiGameEnum.READY.toString()).target(BeiMiGameEnum.BEGIN.toString())
                .event(BeiMiGameEvent.AUTO.toString()).action(new SelectAction<String,String>())	//抢地主 
                .and()
            .withExternal()
                .source(BeiMiGameEnum.BEGIN.toString()).target(BeiMiGameEnum.LASTHANDS.toString())
                .event(BeiMiGameEvent.RAISEHANDS.toString()).action(new MJRaiseHandsAction<String,String>())
                .and()
            .withExternal()
                .source(BeiMiGameEnum.LASTHANDS.toString()).target(BeiMiGameEnum.LASTHANDS.toString())
                .event(BeiMiGameEvent.DEAL.toString()).action(new DealMJCardAction<String,String>())
                .and()
             .withExternal()
                .source(BeiMiGameEnum.LASTHANDS.toString()).target(BeiMiGameEnum.PLAY.toString())
                .event(BeiMiGameEvent.PLAYCARDS.toString()).action(new PlayMJCardsAction<String,String>())
                .and()
            .withExternal()
                .source(BeiMiGameEnum.PLAY.toString()).target(BeiMiGameEnum.END.toString())
                .event(BeiMiGameEvent.ALLCARDS.toString()).action(new AllCardsAction<String,String>())
                .and()
            ;
    }
}
