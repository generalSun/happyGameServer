package com.beimi.disruptor;

import com.beimi.event.UserDataEvent;
import com.beimi.event.UserEvent;
import com.lmax.disruptor.RingBuffer;

public class UserDataEventProducer {
	private final RingBuffer<UserDataEvent> ringBuffer;

    public UserDataEventProducer(RingBuffer<UserDataEvent> ringBuffer)
    {
        this.ringBuffer = ringBuffer;
    }

    public void onData(UserEvent userEvent)
    {
        long id = ringBuffer.next();  // Grab the next sequence
        try{
        	UserDataEvent event = ringBuffer.get(id);
        	event.setEvent(userEvent);
        }finally{
            ringBuffer.publish(id);
        }
    }
}
