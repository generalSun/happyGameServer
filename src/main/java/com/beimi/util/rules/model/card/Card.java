package com.beimi.util.rules.model.card;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * @author huangzh on 2017-10-11 3:47
 * @email seenet2004@163.com
 * 说明：
 */
public class Card implements Serializable {
    private static Card _instance= null;

    public static Card getInstance() {
        if (_instance==null)
            _instance = new Card();
        return _instance;
    }

    private  Map<Integer, String> cardMap = null;

    public Map<Integer, String> getCardNameInst() {
        if (cardMap == null) {
            cardMap = new HashMap<Integer, String>();
            cardMap.put(53, "大鬼");
            cardMap.put(52, "小鬼");
            cardMap.put(51, "方块2");
            cardMap.put(50, "草花2");
            cardMap.put(49, "红桃2");
            cardMap.put(48, "黑桃2");
            cardMap.put(47, "方块A");
            cardMap.put(46, "草花A");
            cardMap.put(45, "红桃A");
            cardMap.put(44, "黑桃A");
            cardMap.put(43, "方块K");
            cardMap.put(42, "草花K");
            cardMap.put(41, "红桃K");
            cardMap.put(40, "黑桃K");
            cardMap.put(39, "方块Q");
            cardMap.put(38, "草花Q");
            cardMap.put(37, "红桃Q");
            cardMap.put(36, "黑桃Q");
            cardMap.put(35, "方块J");
            cardMap.put(34, "草花J");
            cardMap.put(33, "红桃J");
            cardMap.put(32, "黑桃J");
            cardMap.put(31, "方块10");
            cardMap.put(30, "草花10");
            cardMap.put(29, "红桃10");
            cardMap.put(28, "黑桃10");
            cardMap.put(27, "方块9");
            cardMap.put(26, "草花9");
            cardMap.put(25, "红桃9");
            cardMap.put(24, "黑桃9");
            cardMap.put(23, "方块8");
            cardMap.put(22, "草花8");
            cardMap.put(21, "红桃8");
            cardMap.put(20, "黑桃8");
            cardMap.put(19, "方块7");
            cardMap.put(18, "草花7");
            cardMap.put(17, "红桃7");
            cardMap.put(16, "黑桃7");
            cardMap.put(15, "方块6");
            cardMap.put(14, "草花6");
            cardMap.put(13, "红桃6");
            cardMap.put(12, "黑桃6");
            cardMap.put(11, "方块5");
            cardMap.put(10, "草花5");
            cardMap.put(9, "红桃5");
            cardMap.put(8, "黑桃5");
            cardMap.put(7, "方块4");
            cardMap.put(6, "草花4");
            cardMap.put(5, "红桃4");
            cardMap.put(4, "黑桃4");
            cardMap.put(3, "方块3");
            cardMap.put(2, "草花3");
            cardMap.put(1, "红桃3");
            cardMap.put(0, "黑桃3");
        }
        return cardMap;
    }

    public String getCardName(int id) {
        return Card.getInstance().getCardNameInst().get(id);
    }

    public String cardsToString(byte[] cards){
        if (cards==null)
            return "";

        StringBuffer buffer = new StringBuffer();
        for (int i=0 ;i<cards.length;i++){
            buffer.append(getCardName(cards[i])+",");
        }
        return buffer.toString();
    }

    public String cardBytesToString(byte[] playCards) {
        if (playCards==null)
            return "{}";
        String cardStr = "{";
        for (byte playCard : playCards) {
            cardStr+=playCard + ",";
        }
        cardStr = cardStr.substring(0,cardStr.length()-1);
        cardStr+="}";
        return cardStr;
    }
}
