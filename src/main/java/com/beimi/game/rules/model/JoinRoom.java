package com.beimi.game.rules.model;

import com.beimi.core.engine.game.Message;
import com.beimi.web.model.GameRoom;
import com.beimi.web.model.PlayUserClient;

public class JoinRoom implements Message{
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private String command ;
	private PlayUserClient player ;
	private int index ;
	private int maxplayers ;
	private String event ;
	private GameRoom gameRoom ;
	
	public String getEvent() {
		return event;
	}

	public void setEvent(String event) {
		this.event = event;
	}
	
	
	public JoinRoom(PlayUserClient player , int index , int maxplayer , GameRoom gameRoom){
		this.player = player;
		this.index = index;
		this.maxplayers = maxplayer ;
		this.gameRoom = gameRoom;
	}

	public GameRoom getGameRoom() {
		return gameRoom;
	}
	public void setGameRoom(GameRoom gameRoom) {
		this.gameRoom = gameRoom;
	}
	
	public String getCommand() {
		return command;
	}
	public void setCommand(String command) {
		this.command = command;
	}
	public PlayUserClient getPlayer() {
		return player;
	}
	public void setPlayer(PlayUserClient player) {
		this.player = player;
	}
	public int getIndex() {
		return index;
	}
	public void setIndex(int index) {
		this.index = index;
	}
	public int getMaxplayers() {
		return maxplayers;
	}
	public void setMaxplayers(int maxplayers) {
		this.maxplayers = maxplayers;
	}
}
