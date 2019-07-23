package com.beimi.iface;

import java.util.List;

import com.beimi.game.rules.model.Board;
import com.beimi.web.model.GamePlayway;
import com.beimi.web.model.GameRoom;
import com.beimi.web.model.PlayUserClient;

/**
 * 棋牌游戏接口API
 * @author iceworld
 *
 */
public interface ChessGame {
	/**
	 * 创建一局新游戏
	 * @return
	 */
	public Board process(List<PlayUserClient> playUsers , GameRoom gameRoom ,GamePlayway playway ,  String banker , int cardsnum) ;
}
