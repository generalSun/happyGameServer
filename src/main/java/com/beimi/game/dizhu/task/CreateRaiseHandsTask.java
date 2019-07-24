package com.beimi.game.dizhu.task;
import java.util.Arrays;
import org.apache.commons.lang.ArrayUtils;
import org.cache2k.expiry.ValueWithExpiryTime;
import com.beimi.core.BMDataContext;
import com.beimi.core.engine.game.EventTools;
import com.beimi.config.game.BeiMiGameEvent;
import com.beimi.core.engine.game.BeiMiGameTask;
import com.beimi.core.engine.game.GameBoard;
import com.beimi.core.engine.game.AbstractTask;
import com.beimi.game.GameUtils;
import com.beimi.cache.CacheHelper;
import com.beimi.game.dizhu.DiZhuBoard;
import com.beimi.game.rules.model.NextPlayer;
import com.beimi.game.rules.model.Player;
import com.beimi.web.model.GameRoom;
import com.beimi.web.model.PlayUserClient;
import com.beimi.config.game.MsgConstant;

public class CreateRaiseHandsTask extends AbstractTask implements ValueWithExpiryTime  , BeiMiGameTask{

	private long timer  ;
	private GameRoom gameRoom = null ;
	private String orgi ;
	
	public CreateRaiseHandsTask(long timer , GameRoom gameRoom, String orgi){
		super();
		this.timer = timer ;
		this.gameRoom = gameRoom ;
		this.orgi = orgi ;
	}
	@Override
	public long getCacheExpiryTime() {
		return System.currentTimeMillis()+timer*1000;	//5秒后执行
	}
	
	public void execute(){
		/**
		 * 
		 * 顺手 把牌发了，注：此处应根据 GameRoom的类型获取 发牌方式
		 */
		DiZhuBoard board = (DiZhuBoard) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi());
		Player lastHandsPlayer = null ;
		for(Player player : board.getPlayers()){
			if(player.getPlayuser().equals(board.getBanker())){//抢到地主的人
				byte[] lastHands = board.pollLastHands() ;
				board.setLasthands(lastHands);
				
				board.setNextplayer(new NextPlayer(player.getPlayuser(), false));
				player.setCards(ArrayUtils.addAll(player.getCards(), lastHands)) ;//翻底牌 
				Arrays.sort(player.getCards());									  //重新排序
				player.setCards(GameUtils.reverseCards(player.getCards()));		  //从大到小 倒序
				lastHandsPlayer = player ;
				break ;
			}
		}
		/**
		 * 计算底牌倍率
		 */
		board.setRatio(board.getRatio() * board.calcRatio());
		gameRoom.setCatchfailTimes(0);
		/**
		 * 发送一个通知，翻底牌消息
		 */
		sendEvent(MsgConstant.s2c_msg.LASTHANDS.toString(), new GameBoard(lastHandsPlayer.getPlayuser() , board.getLasthands(), board.getRatio()) , gameRoom) ;
		
		/**
		 * 发送一个 开始打牌的事件 ， 判断当前出牌人是 玩家还是 AI，如果是 AI，则默认 1秒时间，如果是玩家，则超时时间是25秒
		 */
		PlayUserClient playUserClient = EventTools.getInstance().getPlayUserClient(gameRoom.getId(), lastHandsPlayer.getPlayuser(), orgi) ;
		
		if(BMDataContext.PlayerTypeEnum.NORMAL.toString().equals(playUserClient.getPlayertype())){
			super.getGame(gameRoom.getPlayway(), orgi).change(gameRoom , BeiMiGameEvent.PLAYCARDS.toString() , 25);	//应该从 游戏后台配置参数中获取
		}else{
			super.getGame(gameRoom.getPlayway(), orgi).change(gameRoom , BeiMiGameEvent.PLAYCARDS.toString() ,3);	//应该从游戏后台配置参数中获取
		}
		/**
		 * 更新牌局状态
		 */
		CacheHelper.getBoardCacheBean().put(gameRoom.getId(), board, orgi);
		CacheHelper.getGameRoomCacheBean().put(gameRoom.getId(), gameRoom, gameRoom.getOrgi());
	}
}
