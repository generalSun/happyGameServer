package com.beimi.disruptor;

import com.beimi.event.UserDataEvent;
import com.lmax.disruptor.EventFactory;

public class UserDataEventFactory implements EventFactory<UserDataEvent>{

	@Override
	public UserDataEvent newInstance() {
		return new UserDataEvent();
	}
}
