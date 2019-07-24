package com.beimi.game.majiang;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import com.beimi.game.rules.model.SelectColor;
import com.beimi.web.model.GameRoom;
import com.beimi.cache.CacheHelper;
import com.beimi.game.rules.model.Board;
import org.apache.commons.lang3.StringUtils;
import com.beimi.game.rules.model.Player;
import com.beimi.core.engine.game.EventTools;
import com.beimi.game.majiang.task.CreateMJRaiseHandsTask;
import com.beimi.game.GameUtils;
import com.beimi.config.game.BeiMiGameEvent;
import com.beimi.game.rules.model.ActionEvent;
import com.beimi.core.BMDataContext;
import com.beimi.game.rules.model.Action;
import java.util.ArrayList;
import java.util.List;
import com.beimi.game.rules.model.NextPlayer;
import com.beimi.web.model.GamePlayway;
import cn.hutool.core.lang.Console;
import com.beimi.core.engine.game.CardType;
import com.beimi.config.game.MsgConstant;

public class MajiangUtils {
	private static MajiangUtils instance;

	public static MajiangUtils getInstance(){
		if(instance == null){
			instance = new MajiangUtils();
		}
		return instance;
	}

	/**
	 * 出牌，并校验出牌是否合规
	 * @param roomid
	 *
	 * @param userid
	 * @param orgi
	 * @return
	 */
	public SelectColor selectColorRequest(String roomid, String userid, String orgi , String color){
		SelectColor selectColor = null ;
		GameRoom gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, orgi) ;
		if(gameRoom!=null){
			Board board = (Board) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi());
			if(board!=null){
				//超时了 ， 执行自动出牌
//				Player[] players = board.getPlayers() ;
				/**
				 * 检查是否所有玩家都已经选择完毕 ， 如果所有人都选择完毕，即可开始
				 */
				selectColor = new SelectColor(board.getBanker());
				if(!StringUtils.isBlank(color)){
					if(!StringUtils.isBlank(color) && color.matches("[0-2]{1}")){
						selectColor.setColor(Integer.parseInt(color));
					}else{
						selectColor.setColor(0);
					}
					selectColor.setTime(System.currentTimeMillis());
					selectColor.setCommand("selectresult");
					
					selectColor.setUserid(userid);
				}
				boolean allselected = true ;
				for(Player ply : board.getPlayers()){
					if(ply.getPlayuser().equals(userid)){
						if(!StringUtils.isBlank(color) && color.matches("[0-2]{1}")){
							ply.setColor(Integer.parseInt(color));
						}else{
							ply.setColor(0);
						}
						ply.setSelected(true);
					}
					if(!ply.isSelected()){
						allselected = false ;
					}
				}
				CacheHelper.getBoardCacheBean().put(gameRoom.getId() , board, gameRoom.getOrgi());	//更新缓存数据
				EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.SELECTRESULT.toString(), selectColor , gameRoom);	
				/**
				 * 检查是否全部都已经 定缺， 如果已全部定缺， 则发送 开打 
				 */
				if(allselected){
					/**
					 * 重置计时器，立即执行
					 */
					CacheHelper.getExpireCache().put(gameRoom.getId(), new CreateMJRaiseHandsTask(1 , gameRoom , gameRoom.getOrgi()) );
					GameUtils.getGame(gameRoom.getPlayway() , orgi).change(gameRoom , BeiMiGameEvent.RAISEHANDS.toString() , 0);	
				}
			}
		}
		return selectColor ;
	}	
	/**
	 * 麻将 ， 杠碰吃胡过
	 * @param roomid
	 * 
	 * @param userid
	 * @param orgi
	 * @return
	 */
	public ActionEvent actionEventRequest(String roomid, String userid, String orgi , String action){
		ActionEvent actionEvent = null ;
		GameRoom gameRoom = (GameRoom) CacheHelper.getGameRoomCacheBean().getCacheObject(roomid, orgi) ;
		if(gameRoom!=null){
			Board board = (Board) CacheHelper.getBoardCacheBean().getCacheObject(gameRoom.getId(), gameRoom.getOrgi());
			if(board!=null){
				Player player = board.player(userid) ;
				byte card = board.getLast().getCard() ;
				actionEvent = new ActionEvent(board.getBanker() , userid , card , action);
				if(!StringUtils.isBlank(action) && action.equals(BMDataContext.PlayerAction.GUO.toString())){
					/**
					 * 用户动作，选择 了 过， 下一个玩家直接开始抓牌 
					 * bug，待修复：如果有多个玩家可以碰，则一个碰了，其他玩家就无法操作了
					 */
					board.dealRequest(gameRoom, board, orgi , false , null);
				}else if(!StringUtils.isBlank(action) && action.equals(BMDataContext.PlayerAction.PENG.toString()) && allowAction(card, player.getActions() , BMDataContext.PlayerAction.PENG.toString())){
					Action playerAction = new Action(userid , action , card);
					
					int color = card / 36 ;
					int value = card % 36 / 4 ;
					List<Byte> otherCardList = new ArrayList<Byte>(); 
					for(int i=0 ; i<player.getCards().length ; i++){
						if(player.getCards()[i]/36 == color && (player.getCards()[i]%36) / 4 == value){
							continue ;
						}
						otherCardList.add(player.getCards()[i]) ;
					}
					byte[] otherCards = new byte[otherCardList.size()] ;
					for(int i=0 ; i<otherCardList.size() ; i++){
						otherCards[i] = otherCardList.get(i) ;
					}
					player.setCards(otherCards);
					player.getActions().add(playerAction) ;
					
					board.setNextplayer(new NextPlayer(userid , false));
					
					actionEvent.setTarget(board.getLast().getUserid());
					EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.SELECTACTION.toString(), actionEvent , gameRoom);
					
					CacheHelper.getBoardCacheBean().put(gameRoom.getId() , board, gameRoom.getOrgi());	//更新缓存数据
					
					board.playcards(board, gameRoom, player, orgi);
					
				}else if(!StringUtils.isBlank(action) && action.equals(BMDataContext.PlayerAction.GANG.toString()) && allowAction(card, player.getActions() , BMDataContext.PlayerAction.GANG.toString())){
					if(board.getNextplayer().getNextplayer().equals(userid)){
						card = GameUtils.getGangCard(player.getCards()) ;
						actionEvent = new ActionEvent(board.getBanker() , userid , card , action);
						actionEvent.setActype(BMDataContext.PlayerGangAction.AN.toString());
					}else{
						actionEvent.setActype(BMDataContext.PlayerGangAction.MING.toString());	//还需要进一步区分一下是否 弯杠
					}
					/**
					 * 检查是否有弯杠
					 */
					Action playerAction = new Action(userid , action , card);
					for(Action ac : player.getActions()){
						if(ac.getCard() == card && ac.getAction().equals(BMDataContext.PlayerAction.PENG.toString())){
							ac.setGang(true);
							ac.setType(BMDataContext.PlayerGangAction.WAN.toString());
							playerAction = ac ;
							break ;
						}
					}
					int color = card / 36 ;
					int value = card % 36 / 4 ;
					List<Byte> otherCardList = new ArrayList<Byte>(); 
					for(int i=0 ; i<player.getCards().length ; i++){
						if(player.getCards()[i]/36 == color && (player.getCards()[i]%36) / 4 == value){
							continue ;
						}
						otherCardList.add(player.getCards()[i]) ;
					}
					byte[] otherCards = new byte[otherCardList.size()] ;
					for(int i=0 ; i<otherCardList.size() ; i++){
						otherCards[i] = otherCardList.get(i) ;
					}
					player.setCards(otherCards);
					player.getActions().add(playerAction) ;
					
					actionEvent.setTarget("all");	//只有明杠 是 其他人打出的 ， target 是单一对象
					
					EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.SELECTACTION.toString(), actionEvent , gameRoom);
					
					/**
					 * 杠了以后， 从 当前 牌的 最后一张开始抓牌
					 */
					board.dealRequest(gameRoom, board, orgi , true , userid);
				}else if(!StringUtils.isBlank(action) && action.equals(BMDataContext.PlayerAction.HU.toString())){	//判断下是不是 真的胡了 ，避免外挂乱发的数据
					Action playerAction = new Action(userid , action , card);
					player.getActions().add(playerAction) ;
					GamePlayway gamePlayway = (GamePlayway) CacheHelper.getSystemCacheBean().getCacheObject(gameRoom.getPlayway(), gameRoom.getOrgi()) ;
					/**
					 * 不同的胡牌方式，处理流程不同，推倒胡，直接进入结束牌局 ， 血战：当前玩家结束牌局，血流：继续进行，下一个玩家
					 */
					if(gamePlayway.getWintype().equals(BMDataContext.MaJiangWinType.TUI.toString())){		//推倒胡
						GameUtils.getGame(gameRoom.getPlayway() , orgi).change(gameRoom , BeiMiGameEvent.ALLCARDS.toString() , 0);	//打完牌了,通知结算
					}else{ //血战到底
						 if(gamePlayway.getWintype().equals(BMDataContext.MaJiangWinType.END.toString())){		//标记当前玩家的状态 是 已结束
							 player.setEnd(true);
						 }
						 player.setHu(true); 	//标记已经胡了
						 /**
						  * 当前 Player打上标记，已经胡牌了，杠碰吃就不会再有了
						  */
						 /**
						  * 下一个玩家出牌
						  */
						player = board.nextPlayer(board.index(player.getPlayuser())) ;
						/**
						 * 记录胡牌的相关信息，推倒胡 | 血战 | 血流
						 */
						board.setNextplayer(new NextPlayer(player.getPlayuser() , false));
						
						actionEvent.setTarget(board.getLast().getUserid());
						/**
						 * 用于客户端播放 胡牌的 动画 ， 点胡 和 自摸 ，播放不同的动画效果
						 */
						EventTools.getInstance().sendEvent(MsgConstant.s2c_msg.SELECTACTION.toString(), actionEvent , gameRoom);
						CacheHelper.getBoardCacheBean().put(gameRoom.getId() , board, gameRoom.getOrgi());	//更新缓存数据
						
						/**
						 * 杠了以后， 从 当前 牌的 最后一张开始抓牌
						 */
						board.dealRequest(gameRoom, board, orgi , true , player.getPlayuser());
					}
				}
			}
		}
		return actionEvent ;
	}
	/**
	 * 为防止同步数据错误，校验是否允许刚碰牌
	 * @param card
	 * @param actions
	 * @return
	 */
	public boolean allowAction(byte card , List<Action> actions , String actiontype){
		int take_color = card / 36 ;
		int take_value = card%36 / 4 ;
		boolean allow = true ;
		for(Action action : actions){
			int color = action.getCard() / 36 ;
			int value = action.getCard() % 36 / 4 ;
			if(take_color == color && take_value == value && action.getAction().equals(actiontype)){
				allow = false ; break ;
			}
		}
		return allow ;
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
