package com.beimi.config.game;

public class MsgConstant{
	public enum c2s_msg{
		JOINROOM,
		GAMESTATUS,
		DOCATCH,
		GIVEUP,
		CARDTIPS,
		DOPLAYCARDS,
		NOCARDS,
		SELECTCOLOR,
		SELECTACTION,
		RESTART,
		START,
		RECOVERY,
		LEAVE,
		COMMAND,
		SEARCHROOM,
		MESSAGE;
	
		public String toString(){
			return super.toString().toLowerCase() ;
		}
	}

	public enum s2c_msg{
		JOINROOM,
		GAMESTATUS,
		ROOMREADY,
		PLAYEREADY,
		TAKECARDS,
		PLAYERS,

		DOCATCH,
		GIVEUP,
		CARDTIPS,
		DOPLAYCARDS,
		NOCARDS,
		SELECTCOLOR,
		SELECTACTION,
		RESTART,
		START,
		RECOVERY,
		LEAVE,
		COMMAND,
		SEARCHROOM,
		MESSAGE;
	
		public String toString(){
			return super.toString().toLowerCase() ;
		}
	}
}

