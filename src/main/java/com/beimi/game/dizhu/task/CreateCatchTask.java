package com.beimi.game.dizhu.task;
import java.util.List;
import com.beimi.core.engine.game.*;
import com.beimi.game.GameUtils;
import com.beimi.cache.CacheHelper;
import com.beimi.game.rules.model.Player;
import com.beimi.web.model.GameRoom;
import com.beimi.core.engine.game.AbstractTask;
import com.beimi.core.engine.game.BeiMiGameTask;
import com.beimi.game.dizhu.DiZhuBoard;
import com.beimi.web.model.PlayUserClient;
import com.beimi.core.BMDataContext;
import com.beimi.config.game.BeiMiGameEvent;
import com.beimi.game.dizhu.DizhuUtils;
import com.beimi.config.game.MsgConstant;
/**
 * 抢地主任务.
 * 说明：
 *
 * @author huangzh 黄志海 seenet2004@163.com
 * @date 2017-11-15 15:51
 */
public class CreateCatchTask extends AbstractTask implements BeiMiGameTask {

    private long timer;
    private GameRoom gameRoom = null;
    private String orgi ;

    public CreateCatchTask(long timer, GameRoom gameRoom, String orgi) {
        super();
        this.timer = timer;
        this.gameRoom = gameRoom;
        this.orgi = orgi ;
    }

    @Override
    public long getCacheExpiryTime() {
        return System.currentTimeMillis()+timer*1000;	//5秒后执行
    }


    public void execute() {
        DiZhuBoard board = (DiZhuBoard) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi());
        if (board == null){
            return;
        }
        int index = board.getDzCardPlayerIndex();
		Player randomCardPlayer = board.getDzCardPlayer() , catchPlayer = null;
        
		if(randomCardPlayer.isDocatch()){
			catchPlayer = board.next(index);
		}else{
			catchPlayer = randomCardPlayer;
        }
        if (catchPlayer != null) {  //还没抢完庄
            //自动不抢 不管真人假人  随机抢不抢  FIXME 以后考虑看是要怎么搞
            boolean isNormal = true ;
			List<PlayUserClient> users = CacheHelper.getGamePlayerCacheBean().getCacheObject(gameRoom.getId(), orgi) ;
			for(PlayUserClient playUser : users){
				if(catchPlayer.getPlayuser().equals(playUser.getId())){
					if(!playUser.getPlayertype().equals(BMDataContext.PlayerTypeEnum.NORMAL.toString())){
						//AI或托管，自动抢地主，后台配置 自动抢地主的触发时间，或者 抢还是不抢， 无配置的情况下，默认的是抢地主
						isNormal = false ;
						break ;
					}
				}
            }
            boolean accept = false;
            if(isNormal == false){
                accept = GameUtils.randomInst.nextBoolean();
            }
            board = DizhuUtils.getInstance().doCatch(board, catchPlayer , accept,gameRoom) ;
            sendEvent(MsgConstant.s2c_msg.CATCHRESULT.toString(), new GameBoard(catchPlayer.getPlayuser() ,  board.isDocatch() , catchPlayer.isAccept(),board.getRatio()) , gameRoom) ;
            if(accept == true){
				board.setDocatch(true);
            }
            CacheHelper.getBoardCacheBean().put(gameRoom.getId(), board, gameRoom.getOrgi()); //FIXME 为何要put回去，难道是克隆了吗  答：因为这hazelcast 的集成分布式缓存机制
            if((board.getCatchPlayerNum() == 1 && board.isAllDoCatch() == true) || catchPlayer.getCatchNum() >= 2){
                //通知状态机 , 全部都抢过地主了 ， 把底牌发给 最后一个抢到地主的人
				super.getGame(gameRoom.getPlayway(), orgi).change(gameRoom , BeiMiGameEvent.RAISEHANDS.toString() , 1);
			}else{
                //通知继续抢
                super.getGame(gameRoom.getPlayway(), orgi).change(gameRoom , BeiMiGameEvent.AUTO.toString() , 1);
            }
        }
    }

}
