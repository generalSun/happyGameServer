package com.beimi.config.game;

import javax.annotation.Resource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.beimi.config.game.Game;
import com.beimi.core.statemachine.BeiMiStateMachine;
import com.beimi.core.statemachine.impl.BeiMiMachineHandler;

@Configuration
public class BeiMiStateMachineHandlerConfig {
	
	@Resource(name="dizhu")    
	private BeiMiStateMachine<String,String> dizhuConfigure ;
	
	@Resource(name="majiang")    
	private BeiMiStateMachine<String,String> maJiangConfigure ;
	
    @Bean("dizhuGame")
    public Game dizhu() {
        return new Game(new BeiMiMachineHandler(this.dizhuConfigure));
    }
    
    @Bean("majiangGame")
    public Game majiang() {
        return new Game(new BeiMiMachineHandler(this.maJiangConfigure));
    }
}
