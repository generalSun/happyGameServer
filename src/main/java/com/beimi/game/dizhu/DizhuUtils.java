package com.beimi.game.dizhu;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import com.beimi.web.model.GameRoom;
import com.beimi.cache.CacheHelper;
import com.beimi.game.rules.model.Player;
import com.beimi.core.engine.game.EventTools;
import com.beimi.game.GameUtils;
import com.beimi.config.game.BeiMiGameEvent;
import com.beimi.web.model.PlayUserClient;
import com.beimi.core.engine.game.GameBoard;
import com.beimi.game.rules.model.TakeCards;
import org.apache.commons.lang3.StringUtils;
import com.beimi.core.engine.game.CardType;
import com.beimi.core.BMDataContext;
import com.beimi.game.rules.model.Board;
import cn.hutool.core.lang.Console;

public class DizhuUtils {
	private static DizhuUtils instance;

	public static DizhuUtils getInstance(){
		if(instance == null){
			instance = new DizhuUtils();
		}
		return instance;
	}

	/**
	 * 抢地主，斗地主
	 * @param roomid

	 * @param orgi
	 * @return
	 */
	public void actionRequest(String roomid, PlayUserClient playUser, String orgi , boolean accept){
		GameRoom gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, orgi) ;
		if(gameRoom!=null){
			DiZhuBoard board = (DiZhuBoard) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getId(), orgi);
			Player player = board.player(playUser.getId()) ;
			board = doCatch(board, player , accept,gameRoom) ;
			EventTools.getInstance().sendEvent("catchresult",new GameBoard(player.getPlayuser() , board.isDocatch() , player.isAccept(), board.getRatio()),gameRoom) ;
			if(accept == true){
				board.setDocatch(true);
			}
			CacheHelper.getBoardCacheBean().put(gameRoom.getId() , board , orgi) ;
			if((board.getCatchPlayerNum() == 1 && board.isAllDoCatch() == true) || player.getCatchNum() >= 2){
				//通知状态机 , 全部都抢过地主了 ， 把底牌发给 最后一个抢到地主的人
				GameUtils.getGame(gameRoom.getPlayway() , orgi).change(gameRoom , BeiMiGameEvent.RAISEHANDS.toString() , 1);
			}else{
				GameUtils.getGame(gameRoom.getPlayway() , orgi).change(gameRoom , BeiMiGameEvent.AUTO.toString() , 1);	//通知状态机 , 继续执行
			}
		}
    }
    
    /**
	 * 抢地主，斗地主
	 * @param roomid

	 * @param orgi
	 * @return
	 */
	public void cardTips(String roomid, PlayUserClient playUser, String orgi , String cardtips){
		GameRoom gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, orgi) ;
		if(gameRoom!=null){
			DiZhuBoard board = (DiZhuBoard) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi());
			Player player = board.player(playUser.getId()) ;
			
			TakeCards takeCards = null ;
			
			if(!StringUtils.isBlank(cardtips)){
				String[] cards = cardtips.split(",") ;
				byte[] tipCards = new byte[cards.length] ;
				for(int i= 0 ; i<cards.length ; i++){
					tipCards[i] = Byte.parseByte(cards[i]) ;
				}
				takeCards = board.cardtip(player, board.getCardTips(player, tipCards)) ;
			}
			if(takeCards == null || takeCards.getCards() == null){
				if(board.getLast() != null && !board.getLast().getUserid().equals(player.getPlayuser())){	//当前无出牌信息，刚开始出牌，或者出牌无玩家 压
					takeCards = board.cardtip(player, board.getLast()) ;
				}else{
					takeCards = board.cardtip(player, null) ;
				}
			}
			
			if(takeCards.getCards() == null){
				takeCards.setAllow(false);	//没有 管的起的牌
			}
			EventTools.getInstance().sendEvent("cardtips", takeCards ,gameRoom) ;
		}
	}

	/**
	 * 校验当前出牌是否合规
	 * @param playCardType
	 * @param lastCardType
	 * @return
	 */
	public boolean allow(CardType playCardType , CardType lastCardType){
		boolean allow = false ;
		if(playCardType.isKing()){	//王炸，无敌
			allow = true ;
		}else if(lastCardType.isKing()){
			allow = false ;
		}else if(playCardType.isBomb()){
			if(lastCardType.isBomb()){ //都是炸弹
				if(playCardType.getMaxcard() > lastCardType.getMaxcard()){
					allow = true ;
				}
			}else{
				allow = true ;
			}
		}else if(lastCardType.isBomb()){	//最后一手牌是炸弹 ， 当前出牌不是炸弹
			allow = false ;
		}else if(playCardType.getCardtype() == lastCardType.getCardtype() && playCardType.getCardtype()>0 && playCardType.getTypesize() == lastCardType.getTypesize()){
			if(playCardType.getCardtype() == BMDataContext.CardsTypeEnum.ONE.getType()){
				int playerMaxCard = playCardType.getMaxcard();
				int lastMaxCard = lastCardType.getMaxcard();
				if(lastMaxCard == 13){
					lastMaxCard = lastCardType.getMaxcardvalue();
				}
				if(playerMaxCard == 13){
					playerMaxCard = playCardType.getMaxcardvalue();
				}
				allow = playerMaxCard > lastMaxCard;
			}else if(playCardType.getMaxcard() > lastCardType.getMaxcard()){
				allow = true ;
			}
		}
		return allow ;
	}

	/** 
	 * 抢地主的时候，首个抢地主 不翻倍
	 * @param board
	 * @param player
	 * @return
	 */
	public DiZhuBoard doCatch(DiZhuBoard board, Player player , boolean result, GameRoom gameRoom){
		if(result == true){	//抢了地主
			player.setCatchNum(player.getCatchNum()+1);
			if(board.isAdded() == false){
				board.setAdded(true);
			}else{
				board.setRatio(board.getRatio()*2);
			}
			board.setBanker(player.getPlayuser());
		}else{
			player.setCatchNum(player.getCatchNum()-1);
			board.setCatchPlayerNum(board.getCatchPlayerNum()-1);
		}
		player.setAccept(result); //抢地主
		player.setDocatch(true);//判断玩家是否操作过
		return board ;
	}

	/**
	 * 临时放这里，重构的时候 放到 游戏类型的 实现类里
	 * @param board
	 * @param player
	 * @return
	 */
	public void doBomb(Board board , boolean add){
		if(add){	//抢了地主
			board.setRatio(board.getRatio()*2);
		}
	}

	
	/**
	 * 获取牌值
	 * @param card
	 * @return
	 */
	public int getCardValue(int card){
		int value = card % 13;
		int color = (int)Math.floor(card / 13);
		if(color == 4){
			value = 13;
		}
		return value;
	}

	/**
	 * 获取客户端显示牌值
	 * @param card
	 * @return
	 */
	public int getCardLogicValue(int card){
		int value = getCardValue(card);
		value = value + 3;
		if(value >= 16){
			value = 14;
		}else if(value > 13){
			value = value - 13;
		}
		return value;
	}

	/**
	 * 获取牌的花色
	 * @param card
	 * @return
	 */
	public int getCardColor(int card){
		int color = (int)Math.floor(card / 13);
		return color;
	}

	/**
	 * 分类
	 * @param cards
	 * @return
	 */
	public Map<Integer , Integer> type(byte[] cards){
		Map<Integer,Integer> types = new HashMap<Integer,Integer>();
		for(int i=0 ; i<cards.length ; i++){
			int card = cards[i];
			int value = getCardValue(card);
			if(types.get(value) == null){
				types.put(value, 1) ;
			}else{
				types.put(value, types.get(value)+1) ;
			}
		}
		return types ;
	}
	
	/**
	 * 牌型识别
	 * @param cards
	 * @return
	 */
	public CardType identification(byte[] cards){
		CardType cardTypeBean = new CardType();
		Map<Integer,Integer> types = new HashMap<Integer,Integer>();
		int max = -1 , maxcard = -1 , cardtype = 0 , mincard = -1 , min = 100;
		Console.log("玩家出牌：");
		for(int i=0 ; i<cards.length ; i++){
			int card = cards[i];
			int value = getCardValue(card);
			int logicValue = getCardLogicValue(card);
			Console.log(String.format("牌：%d   服务端牌值%d  客户端牌值：%d", card,value,logicValue));
			if(types.get(value) == null){
				types.put(value, 1) ;
			}else{
				types.put(value, types.get(value)+1) ;
			}
			if(types.get(value) >= max){
				max = types.get(value) ;//最大个数
				if(maxcard < 0 || value > maxcard){
					maxcard = value ;//最大个数的最大牌值
				}
			}
			if(types.get(value) == max){
				if(mincard < 0 || mincard > value){
					mincard = value ;//最大个数的最小牌值
				}
			}
			
			if(cards[i] > cardTypeBean.getMaxcardvalue()){
				cardTypeBean.setMaxcardvalue(cards[i]);
			}
		}
		
		Iterator<Integer> iterator = types.keySet().iterator() ;
		while(iterator.hasNext()){
			Integer key = iterator.next() ;
			if(types.get(key) < min){
				min = types.get(key) ;
			}
		}
		
		cardTypeBean.setCardnum(max);
		cardTypeBean.setMincard(mincard);
		cardTypeBean.setTypesize(types.size());
		cardTypeBean.setMaxcard(maxcard);
		
		Console.log(String.format("提取出的牌分类尺寸：%d", types.size()));
		String typeName = "无牌型";
		switch(types.size()){
			case 1 : 
				switch(max){
					case 1 : 
						typeName = "单张";
						cardtype = BMDataContext.CardsTypeEnum.ONE.getType() ;
						break;		//单张
					case 2 : 
						if(mincard == 13){
							typeName = "王炸";
							cardtype = BMDataContext.CardsTypeEnum.ELEVEN.getType();//王炸
						}else{
							typeName = "对子";
							cardtype = BMDataContext.CardsTypeEnum.TWO.getType() ;//对子
						}
						break;		//一对
					case 3 : 
						typeName = "三张";
						cardtype = BMDataContext.CardsTypeEnum.THREE.getType() ;
						break;		//三张
					case 4 : 
						typeName = "炸弹";
						cardtype = BMDataContext.CardsTypeEnum.TEN.getType() ;
						break;		//炸弹
				}
				break ;
			case 2 :
				switch(max){
					case 3 :
						if(min == 1){//三带一
							typeName = "三带一";
							cardtype = BMDataContext.CardsTypeEnum.FOUR.getType() ;
						}else if(min == 2){//三带一对
							if(cardTypeBean.getMaxcardvalue() != 53){
								typeName = "三带一对";
								cardtype = BMDataContext.CardsTypeEnum.FORMTWO.getType() ;
							}
						}else if(min == 3){//飞机不带
							if(isAva(types,mincard) && maxcard <= 11){
								typeName = "飞机不带";
								cardtype = BMDataContext.CardsTypeEnum.SEVEN.getType() ;
							}
						}
						break;	
					case 4 : 
						typeName = "四带一对";
						cardtype = BMDataContext.CardsTypeEnum.NINE.getType() ;
						break;	//四带一对
				}
				break ;
			case 3 : 
				switch(max){
					case 1 : ;break;	//无牌型
					case 2 : 
						if(cards.length == 6 && isAva(types, mincard) && maxcard <= 11){
							typeName = "3连对";
							cardtype = BMDataContext.CardsTypeEnum.SIX.getType() ;
						}
						break;		//3连对
					case 3 : 
						if(isAva(types, mincard) && min == max && maxcard <= 11){
							typeName = "三飞";
							cardtype = BMDataContext.CardsTypeEnum.SEVEN.getType() ;
						}
						break;		//三飞
					case 4 : 
						if(cards.length == 6){
							typeName = "四带二";
							cardtype = BMDataContext.CardsTypeEnum.NINE.getType() ;//四带二
						}else if(cards.length == 8 && cardTypeBean.getMaxcardvalue() != 53){
							typeName = "四带二对";
							cardtype = BMDataContext.CardsTypeEnum.NINEONE.getType() ;//四带二对
						}
						break;		
				}
				break;
			case 4 : 
				switch(max){
					case 1 : ;break;		//无牌型
					case 2 : 
						if(cards.length == 8 && isAva(types, mincard) && maxcard <= 11){
							typeName = "4连对";
							cardtype = BMDataContext.CardsTypeEnum.SIX.getType() ;
						}
						break;		//4连对
					case 3 : 
						if(isAva(types, mincard,3) && maxcard <= 11){
							if(cards.length == 8){
								typeName = "飞机	带翅膀";
								cardtype = BMDataContext.CardsTypeEnum.EIGHT.getType() ;//飞机	带翅膀
							}else if(cards.length == 10){
								typeName = "飞机	带翅膀";
								cardtype = BMDataContext.CardsTypeEnum.EIGHTONE.getType() ;//飞机	带翅膀
							}
						}
						break;		//飞机
				};
				break ;
			case 5 : 
				switch(max){
					case 1 : 
						if(isAva(types ,mincard) && max == min && maxcard <= 11){
							typeName = "顺子";
							cardtype = BMDataContext.CardsTypeEnum.FIVE.getType() ;
						}
						break;		//顺子
					case 2 : 
						if(cards.length == 10 && isAva(types, mincard) && maxcard <= 11){
							typeName = "5连对";
							cardtype = BMDataContext.CardsTypeEnum.SIX.getType() ;
						}
						break;		//5连对
					case 3 : 
						if(isAva(types, mincard) && max == min && maxcard <= 11){
							typeName = "5飞机";
							cardtype = BMDataContext.CardsTypeEnum.SEVEN.getType() ;
						}
						break;		//5飞机
				};
				break ;
			case 6 : 
				switch(max){
					case 1 : 
						if(isAva(types ,mincard) && max == min && maxcard <= 11){
							typeName = "顺子";
							cardtype = BMDataContext.CardsTypeEnum.FIVE.getType() ;
						}
						break;		//顺子
					case 2 : 
						if(isAva(types ,mincard) && max == min && maxcard <= 11){
							typeName = "6连对";
							cardtype = BMDataContext.CardsTypeEnum.SIX.getType() ;
						}
						break;		//6连对
					case 3 : 
						if(isAva(types ,mincard) && max == min && maxcard <= 11){
							typeName = "6飞机";
							cardtype = BMDataContext.CardsTypeEnum.SEVEN.getType() ;
						}
						break;		//6飞机
				};
				break ;
			default:
				switch(max){
					case 1 : 
						if(isAva(types ,mincard) && max == min && maxcard <= 11){
							typeName = "顺子";
							cardtype = BMDataContext.CardsTypeEnum.FIVE.getType() ;
						}
						break;		//顺子
					case 2 : 
						if(isAva(types ,mincard) && max == min && maxcard <= 11){
							typeName = "连对";
							cardtype = BMDataContext.CardsTypeEnum.SIX.getType() ;
						}
						break;		//6连对
					case 3 : 
						if(isAva(types ,mincard) && max == min && maxcard <= 11){
							typeName = "飞机";
							cardtype = BMDataContext.CardsTypeEnum.SEVEN.getType() ;
						}
						break;		//6飞机
				};
				break;
		}
		cardTypeBean.setCardtype(cardtype);
		cardTypeBean.setKing(cardtype == BMDataContext.CardsTypeEnum.ELEVEN.getType());
		cardTypeBean.setBomb(cardtype == BMDataContext.CardsTypeEnum.TEN.getType());

		Console.log(String.format("分析出的牌型：%s", typeName));
		return cardTypeBean ;
	}

	private boolean isAva(Map<Integer,Integer> types , int mincard, int num){
		boolean ava = true ;
		Map<Integer,Integer> temp = new HashMap<Integer,Integer>();
		int minValue = -1;
		for(int i = mincard ; i< 14  ; i++){
			if(types.get(i) != null && types.get(i) == num){
				if(minValue < 0){
					minValue = i;
				}
				temp.put(i, num);
			}
		}
		ava = isAva(temp, minValue);
		return ava ;
	}
	
	private boolean isAva(Map<Integer,Integer> types , int mincard){
		boolean ava = true ;
		for(int i=mincard ; i<(mincard + types.size())  ; i++){
			if(types.get(i) == null){
				ava = false  ;
			}
		}
		return ava ;
	}
}
