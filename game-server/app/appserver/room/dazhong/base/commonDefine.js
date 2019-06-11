const Define = module.exports;
const _ = require('lodash');
//门风、圈风
Define.WIND_EAST = 0;//东
Define.WIND_SOUTH = 1;	//南
Define.WIND_WEST = 2;	//西
Define.WIND_NORTH = 3;	//北
Define.WIND_COUNT = 4;	//门风、圈风总数

Define.COLOR_WAN = 0;	// 万
Define.COLOR_TIAO = 1;	// 条
Define.COLOR_BING = 2;	// 饼
Define.COLOR_WIND = 3;	// 风
Define.COLOR_JIAN = 4;	// 箭
Define.COLOR_FLOWER = 5;	// 梅兰竹菊
Define.COLOR_SEASON = 6;	// 春夏秋冬
Define.COLOR_FENG_JIAN = 3;	//风箭（用于GameLogic中，因为与疯狂麻将的判断值冲突，所以补充一个）
Define.COLOR_HUA = 4;	//花牌（用于GameLogic中，因为与疯狂麻将的判断值冲突，所以补充一个）
Define.STONE_NO1 = 0;	// 1
Define.STONE_NO2 = 1;	// 1
Define.STONE_NO3 = 2;	// 1
Define.STONE_NO4 = 3;	// 1
Define.STONE_NO5 = 4;	// 1
Define.STONE_NO6 = 5;	// 1
Define.STONE_NO7 = 6;	// 1
Define.STONE_NO8 = 7;	// 1
Define.STONE_NO9 = 8;	// 1
Define.TILE_NO1 = Define.STONE_NO1;
Define.TILE_NO2 = Define.STONE_NO2;
Define.TILE_NO3 = Define.STONE_NO3;
Define.TILE_NO4 = Define.STONE_NO4;
Define.TILE_NO5 = Define.STONE_NO5;
Define.TILE_NO6 = Define.STONE_NO6;
Define.TILE_NO7 = Define.STONE_NO7;
Define.TILE_NO8 = Define.STONE_NO8;
Define.TILE_NO9 = Define.STONE_NO9;
Define.INVALID_CARD = 65535;	//无效牌
Define.INVALID_CARD_INDEX = 65535;	//无效牌索引

// 有关牌的一些宏
Define.MAX_HAND_COUNT = 17;	// 手上最多只可能有17张牌
Define.MAX_SHOW_COUNT = 6;	// 吃碰杠的牌组数
Define.MAX_DICE_COUNT = 4;	// 最多的骰子数目
Define.MAX_TILE_COUNT = 144;	// 最多的牌的张数
Define.MAX_SET_COUNT = 1;	// 最多一副牌
Define.MAX_FRUSTA_COUNT = 18;	// 牌墙最多墩数
Define.MAX_DISCARD_COUNT = 48;	// 一局中最多出这么多张牌

// 每个分组的组合形式
Define.GROUP_STYLE_SHUN = 1;	// 顺
Define.GROUP_STYLE_KE = 2;	// 刻
Define.GROUP_STYLE_JONG = 3;	// 将
Define.GROUP_STYLE_MINGGANG = 4;	// 明杠
Define.GROUP_STYLE_ANGANG = 5;	// 暗杠
Define.GROUP_STYLE_LONG = 6;	// 组合龙
Define.GROUP_STYLE_HUN = 7;	// 全混

Define.MAXFANNAMELEN = 32;
Define.MAXFANS = 128;		// 最大番种数
Define.WIN_FAIL = -1;		// 诈和
Define.NORMAL = 0;		// 普通和牌
Define.PENPENHU = 4;		// 碰碰和
Define.QIDUI = 5;		// 七对
Define.SHISHANYAO = 6;		// 十三幺
Define.QUANBUKAO = 7;		// 全不靠
Define.ZUHELONG = 8;		// 组合龙

Define.TILE_ID = function (color, what, count) {
  return (((color) << 8) | ((what) << 4) | (count));
};
Define.TILE_COLOR = function (id) {
  return (((id) >> 8) & 0x0F);
}
Define.TILE_WHAT = function (id) {
  return (((id) >> 4) & 0x0F);
}
Define.SAME_TILE_ID = function (a, b) {
  return (((a) & 0xFFFF) == ((b) & 0xFFFF));
}


// 胡牌方式
Define.WIN_MODE_GANGSHANGHU = (1 << 0);	// 杠上开花
Define.WIN_MODE_QIANGGANG = (1 << 1);	// 抢杠
Define.WIN_MODE_HUJUEZHANG = (1 << 2);	// 和绝张
Define.WIN_MODE_HAIDI = (1 << 3);	// 海底
Define.WIN_MODE_ZIMO = (1 << 4);	// 自摸
Define.WIN_MODE_TIANHU = (1 << 5);	// 天和
Define.WIN_MODE_DIHU = (1 << 6);	// 地和
Define.WIN_MODE_RENHU = (1 << 7);	// 人和
Define.WIN_MODE_TIANTING = (1 << 8);	// 天听
Define.WIN_MODE_7QIANG1 = (1 << 9);	// 七抢一
Define.WIN_MODE_LIZHI = (1 << 10); // 立直
Define.WIN_MODE_GANGPAO = (1 << 11);	// 杠上炮

//吃碰杠掩码
Define.REQUEST_TYPE_CHI = (1 << 0);	// 请求吃牌
Define.REQUEST_TYPE_PENG = (1 << 1);	// 请求碰牌
Define.REQUEST_TYPE_GANG = (1 << 2);	// 请求杠牌

// 和牌基本番种
//88番
//1 大四喜 由4副风刻=杠;组成的和牌。不计圈风刻、门风刻、三风刻、碰碰和
Define.FAN_DA4XI = 0;
//2 大三元 和牌中，有中发白3副刻子。不计箭刻
Define.FAN_DA3YUAN = 1;
//3 绿一色 由23468条及发字中的任何牌组成的顺子、刻子、将的和牌。不计混一色。如无“发”字组成的各牌，可计清一色
Define.FAN_LVYISHE = 2;
//4 九莲宝灯 由一种花色序数牌子按1112345678999组成的特定牌型，见同花色任何1张序数牌即成和牌。不计清一色
Define.FAN_9LIANBAODEN = 3;
//5 四杠 4个杠
Define.FAN_4GANG = 4;
//6 连七对 由一种花色序数牌组成序数相连的7个对子的和牌。不计清一色、不求人、单钓
Define.FAN_LIAN7DUI = 5;
//7 十三幺 由3种序数牌的一、九牌，7种字牌及其中一对作将组成的和牌。不计五门齐、不求人、单钓
Define.FAN_131 = 6;

//64番
//8 清幺九 由序数牌一、九刻子组成的和牌。不计碰碰和、同刻、元字
Define.FAN_QING19 = 7;
//9 小四喜 和牌时有风牌的3副刻子及将牌。不计三风刻
Define.FAN_XIAO4XI = 8;
//10 小三元 和牌时有箭牌的两副刻子及将牌。不计箭刻
Define.FAN_XIAO3YUAN = 9;
//11 字一色 由字牌的刻子=杠;、将组成的和牌。不计碰碰和
Define.FAN_ZI1SHE = 10;
//12 四暗刻 4个暗刻=暗杠;。不计门前清、碰碰和
Define.FAN_4ANKE = 11;
//13 一色双龙会 一种花色的两个老少副，5为将牌。不计平和、七对、清一色
Define.FAN_1SHE2GLONG = 12;

//48番
//14 一色四同顺 一种花色4副序数相同的顺子，不计一色三节高、一般高、四归一
Define.FAN_1SHE4TONGSHUN = 13;
//15 一色四节高 一种花色4副依次递增一位数的刻子不计一色三同顺、碰碰和
Define.FAN_1SHE4JIEGAO = 14;

//32番
//16 一色四步高 一种花色4副依次递增一位数或依次递增二位数的顺子
Define.FAN_1SHE4BUGAO = 15;
//17 三杠 3个杠
Define.FAN_3GANG = 16;
//18 混幺九 由字牌和序数牌一、九的刻子用将牌组成的各牌。不计碰碰和
Define.FAN_HUN19 = 17;

//24番
//19 七对 由7个对子组成和牌。不计不求人、单钓
Define.FAN_7DUI = 18;
//20 七星不靠 必须有7个单张的东西南北中发白，加上3种花色，数位按147、258、369中的7张序数牌组成没有将牌的和牌。不计五门齐、不求人、单钓
Define.FAN_7XINBUKAO = 19;
//21 全双刻 由2、4、6、8序数牌的刻子、将牌组成的和牌。不计碰碰和、断幺
Define.FAN_QUANSHUANGKE = 20;
//22 清一色 由一种花色的序数牌组成和牌。不无字
Define.FAN_QING1SHE = 21;
//23 一色三同顺 和牌时有一种花色3副序数相同的顺子。不计一色三节高
Define.FAN_1SHE3TONGSHUN = 22;
//24 一色三节高 和牌时有一种花色3副依次递增一位数字的刻子。不计一色三同顺
Define.FAN_1SHE3JIEGAO = 23;
//25 全大 由序数牌789组成的顺子、刻子=杠;、将牌的和牌。不计无字
Define.FAN_QUANDA = 24;
//26 全中 由序数牌456组成的顺子、刻子=杠;、将牌的和牌。不计断幺
Define.FAN_QUANZHONG = 25;
//27 全小 由序数牌123组成的顺子、刻子=杠;将牌的的和牌。不计无字
Define.FAN_QUANXIAO = 26;

//16番
//28 清龙 和牌时，有一种花色1-9相连接的序数牌
Define.FAN_QINGLONG = 27;
//29 三色双龙会 2种花色2个老少副、另一种花色5作将的和牌。不计喜相逢、老少副、无字、平和
Define.FAN_3SHE2LONG = 28;
//30 一色三步高 和牌时，有一种花色3副依次递增一位或依次递增二位数字的顺子
Define.FAN_1SHE3BUGAO = 29;
//31 全带五 每副牌及将牌必须有5的序数牌。不计断幺
Define.FAN_QUANDAI5 = 30;
//32 三同刻 3个序数相同的刻子=杠;
Define.FAN_3TONGKE = 31;
//33 三暗刻 3个暗刻
Define.FAN_3ANKE = 32;

//12番
//34 全不靠 由单张3种花色147、258、369不能错位的序数牌及东南西北中发白中的任何14张牌组成的和牌。不计五门齐、不求人、单钓
Define.FAN_QUANBUKAO = 33;
//35 组合龙 3种花色的147、258、369不能错位的序数牌
Define.FAN_ZHUHELONG = 34;
//36 大于五 由序数牌6-9的顺子、刻子、将牌组成的和牌。不计无字
Define.FAN_DAYU5 = 35;
//37 小于五 由序数牌1-4的顺子、刻子、将牌组成的和牌。不计无字
Define.FAN_XIAOYU5 = 36;
//38 三风刻 3个风刻
Define.FAN_3FENGKE = 37;

//8 番
//39 花龙 3种花色的3副顺子连接成1-9的序数牌
Define.FAN_HUALONG = 38;
//40 推不倒 由牌面图形没有上下区别的牌组成的和牌，包括1234589饼、245689条、白板。不计缺一门
Define.FAN_TUIBUDAO = 39;
//41 三色三同顺 和牌时，有3种花色3副序数相同的顺子
Define.FAN_3SHE3TONGSHUN = 40;
//42 三色三节高 和牌时，有3种花色3副依次递增一位数的刻子
Define.FAN_3SHEJIEJIEGAO = 41;
//43 无番和 和牌后，数不出任何番种分=花牌不计算在内;
Define.FAN_WUFAN = 42;
//44 妙手回春 自摸牌墙上最后一张牌和牌。不计自摸
Define.FAN_MIAOSHOU = 43;
//45 海底捞月 和打出的最后一张牌
Define.FAN_HAIDI = 44;
//46 杠上开花 开杠抓进的牌成和牌=不包括补花;不计自摸
Define.FAN_GANGHU = 45;
//47 抢杠和 和别人自抓开明杠的牌。不计和绝张
Define.FAN_QIANGGANG = 46;

//6 番
//48 碰碰和 由4副刻子=或杠;、将牌组成的和牌
Define.FAN_PENPENHU = 47;
//49 混一色 由一种花色序数牌及字牌组成的和牌
Define.FAN_HUN1SHE = 48;
//50 三色三步高 3种花色3副依次递增一位序数的顺子
Define.FAN_3SHE3BUGAO = 49;
//51 五门齐 和牌时3种序数牌、风、箭牌齐全
Define.FAN_5MENQI = 50;
//52 全求人 全靠吃牌、碰牌、单钓别人批出的牌和牌。不计单钓
Define.FAN_QUANQIUREN = 51;
//53 双暗杠 2个暗杠
Define.FAN_2ANGANG = 52;
//54 双箭刻 2副箭刻=或杠;
Define.FAN_2JIANKE = 53;

//4 番
//55 全带幺 和牌时，每副牌、将牌都有幺牌
Define.FAN_QUANDAIYAO = 54;
//56 不求人 4副牌及将中没有吃牌、碰牌=包括明杠;，自摸和牌
Define.FAN_BUQIUREN = 55;
//57 双明杠 2个明杠
Define.FAN_2MINGANG = 56;
//58 和绝张 和牌池、桌面已亮明的3张牌所剩的第4张牌=抢杠和不计和绝张;
Define.FAN_HUJUEZHANG = 57;

//2 番
//59 箭刻 由中、发、白3张相同的牌组成的刻子
Define.FAN_JIANKE = 58;
//60 圈风刻 与圈风相同的风刻
Define.FAN_QUANFENG = 59;
//61 门风刻 与本门风相同的风刻
Define.FAN_MENGFENG = 60;
//62 门前清 没有吃、碰、明杠，和别人打出的牌
Define.FAN_MENGQING = 61;
//63 平和 由4副顺子及序数牌作将组成的和牌，边、坎、钓不影响平和
Define.FAN_PINHU = 62;
//64 四归一 和牌中，有4张相同的牌归于一家的顺、刻子、对、将牌中=不包括杠牌;
Define.FAN_4GUI1 = 63;
//65 双同刻 2副序数相同的刻子
Define.FAN_2TONGKE = 64;
//66 双暗刻 2个暗刻
Define.FAN_2ANKE = 65;
//67 暗杠 自抓4张相同的牌开杠
Define.FAN_ANGANG = 66;
//68 断幺九 和牌中没有一、九及字牌 1 番
Define.FAN_DUAN19 = 67;

// 1番
//69 一般高 由一种花色2副相同的顺子组成的牌
Define.FAN_YIBANGAO = 68;
//70 喜相逢 2种花色2副序数相同的顺子
Define.FAN_XIXIANGFENG = 69;
//71 连六 一种花色6张相连接的序数牌
Define.FAN_LIAN6 = 70;
//72 老少副 一种花色牌的123、789两副顺子
Define.FAN_LAOSHAOFU = 71;
//73 幺九刻 3张相同的一、九序数牌及字牌组成的刻子=或杠;
Define.FAN_19KE = 72;
//74 明杠 自己有暗刻，碰别人打出的一张相同的牌开杠：或自己抓进一张与碰的明刻相同的牌开杠
Define.FAN_MINGANG = 73;
//75 缺一门 和牌中缺少一种花色序数牌
Define.FAN_QUE1MEN = 74;
//76 无字 和牌中没有风、箭牌
Define.FAN_WUZI = 75;
//77 边张 单和123的3及789的7或1233和3、77879和7都为边张。手中有12345和3，56789和7不算边张
Define.FAN_BIANZANG = 76;
//78 坎张 和2张牌之间的牌。4556和5也为坎张，手中有45567和6不算坎张
Define.FAN_KANZANG = 77;
//79 单钓将 钓单张牌作将成和
Define.FAN_DANDIAO = 78;
//80 自摸 自己抓进牌成和牌
Define.FAN_ZIMO = 79;
//81 花牌 即春夏秋冬，梅兰竹菊，每花计一分。不计在起和分内，和牌后才能计分。花牌补花成和计自摸分，不计杠上开花
Define.FAN_FLOWER = 80;

//以下是大众规则的番种
//Define.FAN_ZHUHELONG_Q					= 86  ;  // "全不靠之组合龙"
// 168番
Define.FAN_4FANGDAFA = 81;  // "四方大发财"
Define.FAN_TIANHU = 82;  // "天和"
// 158番
Define.FAN_DIHU = 83;  // "地和"
// 108番
Define.FAN_RENHU = 84;  // "人和"
// 88番
Define.FAN_HUNGANG = 85;  // "混杠"
Define.FAN_8XIANGUOHAI = 86;  // "八仙过海"
// 32番
Define.FAN_7QIANG1 = 87;  // "七抢一"
Define.FAN_TIANTING = 88;  // "天听"
// 6番
Define.FAN_HUN4JIE = 89;  // "混四节"
// 4番
Define.FAN_HUN4BU = 90;  // "混四步"
Define.FAN_HUN3JIE = 91;  // "混三节"
// 2番
Define.FAN_WUHUN = 92;  // "无混"
Define.FAN_HUNLONG = 93;  // "混龙"
Define.FAN_HUN3BU = 94;  // "混三步"
Define.FAN_LIZHI = 95;   // "立直"
// 1番
Define.FAN_258JONG = 96;  // "二五八将"
Define.FAN_4FLOWER = 97;  // "梅兰竹菊"
Define.FAN_4SEASON = 98;  // "春夏秋冬"
Define.FAN_SEASONFLOWER = 99;  // "季花"
Define.FAN_19JONG = 100;  // "么九头" 由序数牌的19做将牌




////
Define.T_OK = 0;
Define.F_NOENOUGHFANS = 1;  // 番数不足
Define.F_NOTTING = 2;  // 没听

Define.RULE_GB = 0;       // 国标
Define.RULE_PUBLIC = 1;   // 大众


Define.fans = [
  [
    [2, 12, 13, 15, 21, 22, 24, 25, 26, 27, 29, 30, 35, 36, 39, 51, 55, 54, 61, 62, 63, 67, 68, 70, 71, 76, 77, 78],
    [],
    [2, 13, 15, 22, 27, 29, 39, 48, 51, 54, 55, 61, 63, 68, 70, 71, 76, 77, 78],
    [22, 27, 29, 38, 39, 40, 49, 51, 54, 55, 61, 63, 68, 69, 70, 71, 74, 76, 77, 78, 90, 93, 94],
    [13, 15, 22, 24, 25, 26, 27, 28, 29, 30, 35, 36, 38, 39, 40, 49, 51, 54, 55, 61, 62, 63, 67, 68, 69, 70, 71, 74, 75, 76, 77, 78, 90, 93, 94],
    []
  ],
  [
    [2, 3, 21, 22, 24, 25, 26, 27, 29, 30, 35, 36, 39, 51, 54, 55, 61, 63, 66, 67, 68, 70, 71, 72, 73, 76, 77, 78],
    [],
    [2, 22, 27, 29, 39, 48, 51, 54, 55, 58, 59, 60, 61, 63, 66, 68, 70, 71, 72, 73, 76, 77, 78],
    [22, 27, 29, 38, 39, 40, 49, 51, 54, 55, 58, 59, 60, 61, 63, 66, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 93, 94],
    [22, 24, 25, 26, 27, 29, 30, 35, 36, 38, 39, 40, 49, 51, 54, 55, 61, 63, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 93, 94],
    [38, 40, 49, 50, 51, 54, 55, 58, 59, 60, 61, 63, 66, 69, 71, 72, 73, 76, 77, 78]
  ],
  [
    [2, 3, 21, 24, 25, 26, 30, 35, 36, 39, 51, 52, 54, 55, 56, 61, 63, 65, 66, 67, 68, 70, 71, 72, 73, 76, 77, 78],
    [],
    [2, 9, 39, 48, 51, 52, 53, 54, 55, 56, 58, 59, 60, 61, 63, 65, 66, 68, 70, 71, 72, 73, 76, 77, 78],
    [9, 39, 51, 52, 53, 54, 55, 56, 58, 59, 60, 61, 63, 64, 65, 66, 68, 69, 70, 71, 72, 73, 74, 76, 77, 78],
    [24, 25, 26, 30, 35, 36, 39, 51, 52, 54, 55, 56, 61, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78],
    [50, 51, 52, 54, 55, 56, 58, 59, 60, 61, 63, 64, 65, 66, 69, 71, 72, 73, 76, 77, 78]
  ],
  [
    [2, 16, 21, 24, 25, 26, 23, 32, 35, 36, 39, 51, 52, 55, 56, 61, 63, 65, 66, 67, 72, 73, 76, 77, 78],
    [],
    [1, 2, 8, 9, 16, 23, 32, 37, 39, 48, 51, 52, 53, 54, 55, 56, 58, 59, 60, 61, 63, 65, 66, 72, 73, 76, 77, 78],
    [1, 8, 9, 16, 23, 31, 32, 37, 39, 41, 51, 52, 53, 54, 55, 56, 58, 59, 60, 61, 63, 64, 65, 66, 71, 72, 73, 74, 76, 77, 78, 91],
    [16, 23, 24, 25, 26, 30, 31, 32, 35, 36, 39, 41, 51, 52, 54, 55, 56, 61, 63, 64, 65, 66, 67, 71, 72, 73, 74, 75, 76, 77, 78, 91],
    [16, 31, 32, 41, 50, 51, 52, 54, 55, 56, 58, 59, 60, 61, 63, 64, 65, 66, 71, 72, 73, 76, 77, 78]
  ],
  [
    [2, 4, 11, 14, 16, 20, 21, 23, 24, 25, 26, 35, 36, 39, 47, 51, 52, 55, 61, 63, 65, 66, 67, 32, 72, 78],
    [81, 0, 1, 4, 8, 9, 10, 11, 16, 32, 37, 47, 51, 52, 53, 54, 55, 56, 58, 59, 60, 61, 63, 65, 66, 73, 78],
    [0, 1, 2, 4, 8, 9, 11, 14, 16, 17, 23, 32, 37, 39, 47, 48, 51, 52, 53, 55, 56, 58, 59, 60, 61, 63, 65, 66, 72, 73, 78],
    [0, 1, 4, 8, 9, 11, 16, 17, 23, 31, 32, 37, 39, 41, 47, 51, 52, 53, 54, 55, 56, 58, 59, 60, 61, 63, 64, 65, 66, 71, 72, 73, 74, 78, 89, 91],
    [4, 7, 11, 14, 16, 20, 23, 24, 25, 26, 30, 31, 32, 35, 36, 39, 41, 47, 51, 52, 54, 55, 56, 61, 63, 64, 65, 66, 67, 71, 72, 73, 74, 75, 78, 89, 91],
    [4, 11, 16, 17, 31, 32, 41, 47, 50, 51, 52, 54, 55, 56, 58, 59, 60, 61, 63, 64, 65, 66, 71, 72, 73, 78, 89],
  ],
  [
    [2, 5, 12, 18, 21, 24, 25, 26, 30, 35, 36, 39, 63, 67],
    [5, 10, 18, 63],
    [2, 5, 17, 18, 39, 48, 63],
    [5, 17, 18, 39, 63, 74],
    [5, 7, 18, 24, 25, 26, 35, 36, 39, 63, 67, 74, 75],
    [5, 17, 18, 50, 63]
  ],
  [
    [],
    [],
    [],
    [],
    [],
    [6]
  ],
  [
    [],
    [],
    [],
    [],
    [],
    [19, 34, 33]
  ],
  [
    [],
    [],
    [],
    [34, 55, 58, 59, 60, 61, 63, 66, 72, 73, 76, 77, 78],
    [34, 55, 61, 62, 63, 66, 72, 73, 75, 76, 77, 78],
    [34, 50, 55, 58, 59, 60, 61, 63, 66, 72, 73, 76, 77, 78]
  ]
];

Define.fanObj = class fanObj {
  constructor() {
    this.nScore = 0;				// 分数
    this.fCheck = null;				// 检查该番种的函数索引
    this.fParse = null;				// 分析该番种的函数索引
  }
};
Define.stoneObj = class stoneObj {
  constructor() {
    this.nID = 0;		// 麻将牌的ID号（唯一）
    this.nColor = 0;		// 麻将牌的花色
    this.nWhat = 0;		// 麻将牌的点数
  }
};

Define.tagTileInfo = class tagTileInfo {
  constructor() {
    this.nGroupIndex = 0;		// 所在分组索引号
    this.nIndex = 0;				// 在分组里的索引号
    this.nColor = 0;				// 花色
    this.nWhat = 0;				// 点数
  }
};
Define.tagFanInfo = class tagFanInfo {
  constructor() {
    this.nID = 0;
    this.nScore = 0;
    this.anTileID = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];		// 涉及到的牌ID
    this.cnTile = 0;				// 涉及到的牌数
  }
}

// 听的那张牌的信息
Define.tagCallTileInfo = class tagCallTileInfo {
  constructor() {
    this.nCallTileID = 0;		// 听哪张牌
    this.nFans = 0;				// 和这张牌有几番
  }
};

// 打掉某张牌后能听的所有牌的信息
Define.tagCallInfo = class tagCallInfo {
  constructor() {
    this.nDiscardTileID = 0;		// 打哪张
    this.cnCallTile = 0;			// 可和的牌张数
    this.asCallTileInfo = [];	// 最多可和34张牌
    for (let i = 0; i < 34; i++) {
      this.asCallTileInfo.push(new Define.tagCallTileInfo());
    }
  }
  clear() {
    this.nDiscardTileID = 0;		// 打哪张
    this.cnCallTile = 0;			// 可和的牌张数
    this.asCallTileInfo = [];	// 最多可和34张牌
    for (let i = 0; i < 34; i++) {
      this.asCallTileInfo[i] = new Define.tagCallTileInfo();
    }
  }
}




Define.groupsRelation = class groupsRelation {
  constructor() {
    this.cnShunGroups = 0;		// 共有多少个顺
    this.cnKeGroups = 0;			// 共有多少个刻
    this.acnShunGroups = [];// 各种顺的数量:123.234.456.567....
    this.acnKeGroups = [];	// 各种刻的数量
    //	let					cnHunGroups;		// 全是混的分组数量(不包括将牌分组)
    //	BOOL				bHunJong;			// 是否全是混做将
    for (let i = 0; i < 3; i++) {
      this.acnShunGroups[i] = [];
      for (let j = 0; j < 7; j++) {
        this.acnShunGroups[i].push(0);
      }
    }
    for (let i = 0; i < 5; i++) {
      this.acnKeGroups[i] = [];
      for (let j = 0; j < 9; j++) {
        this.acnKeGroups[i].push(0);
      }
    }
  }
};

Define.stoneRelation = class stoneRelation {
  constructor() {
    this.cnHun = 0;				// 混牌个数
    this.cnAllColors = 0;		// 所有牌(包括吃碰杠的牌)花色数
    this.acnAllColors = [0, 0, 0, 0, 0];	// 所有牌，每花色牌个数
    this.acnAllStones = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];	// 所有牌，每种牌个数
    this.cnHandColors = 0;		// 手中牌花色数
    this.acnHandColors = [0, 0, 0, 0, 0];	// 手中牌(不包括吃碰杠的牌)每花色牌个数，依次为万条饼风箭
    this.cnStoneTypes = 0;		// 手中有多少种牌(不包括吃碰杠的牌)
    this.acnHandStones = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];  // 手中每种牌个数(不包括吃碰杠的牌)，最后一个元素无用，只是为了方便将风牌和箭牌统一处理
    this.bNoEat = false;				// 没有吃过牌
  }
}
Define.stoneGroup = class stoneGroup {
  constructor() {
    this.asStone = [];
    this.nGroupStyle = 0;
    for (let i = 0; i < 4; i++) {
      obj.asStone[i] = new Define.stoneObj();
    }
  }

};

Define.checkParam = class checkParam {
  constructor() {
    // 以下数据调用方填写
    this.asHandStone = [];// 手中牌
    this.cnHandStone = 0;		// 手中牌的张数
    this.asShowGroup = [];		// 吃碰杠的牌
    //	STONEGROUP *		pShowGroup;			// 吃碰杠的牌
    this.cnShowGroups = 0;		// 吃碰杠的数量
    this.asFlower = [];		// 花牌
    this.cnFlower = 0;			// 花牌个数
    this.cnMinGang = 0;			// 明杠个数
    this.cnAnGang = 0;			// 暗杠个数
    this.nWinMode = 0;			// 和牌方式组合
    this.nMinFan = 0;			// 和牌所需的最低番数
    this.nQuanWind = 0;			// 圈风
    this.nMenWind = 0;			// 门风
    this.nRule = 0;				// 规则
    this.nHunID = 0;				// 混牌ID
    for (let i = 0; i < Define.MAX_HAND_COUNT; i++) {
      this.asHandStone[i] = new Define.stoneObj();
    }
    for (let i = 0; i < 6; i++) {
      this.asShowGroup[i] = new stoneGroup();
    }
    for (let i = 0; i < 8; i++) {
      this.asFlower[i] = new Define.stoneObj();
    }
  }
};

Define.huresult = class huresult {
  constructor() {
    this.nMaxFans = 0;			// 能算出的最高番数
    this.anFans = [];	// 番种列表
    this.nResultant = 0;			// 和牌牌型
    this.asGroup = [];			// 牌型组合方式，最多6组
    this.asHandStone = [];// 手中牌，对不能分组的牌型，这里保存
    // 手中牌的最终信息
    this.cnGroups = 0;			// 分组数
    // 下面几个变量主要用于番种分析，由服务器算完番后填充，再发到客户端
    this.nHuTileID = 0;			// 和的那张牌ID
    this.asFlower = [];		// 花牌
    this.cnFlower = 0;			// 花牌个数
    this.nQuanWind = 0;			// 圈风
    this.nMenWind = 0;			// 门风
    this.cnShowGroups = 0;		// 吃碰杠的分组数
    this.nWinMode = 0;			// 和牌方式
    for (let i = 0; i < Define.MAXFANS; i++) {
      this.anFans[i] = 0;
    }
    for (let i = 0; i < 6; i++) {
      this.asGroup[i] = new Define.stoneGroup();
    }
    for (let i = 0; i < Define.MAX_HAND_COUNT; i++) {
      this.asHandStone[i] = new Define.stoneObj();
    }
    for (let i = 0; i < 8; i++) {
      this.asFlower[i] = new Define.stoneObj();
    }
  }
  clear() {
    this.nMaxFans = 0;			// 能算出的最高番数
    this.anFans = [];	// 番种列表
    this.nResultant = 0;			// 和牌牌型
    this.asGroup = [];			// 牌型组合方式，最多6组
    this.asHandStone = [];// 手中牌，对不能分组的牌型，这里保存
    // 手中牌的最终信息
    this.cnGroups = 0;			// 分组数
    // 下面几个变量主要用于番种分析，由服务器算完番后填充，再发到客户端
    this.nHuTileID = 0;			// 和的那张牌ID
    this.asFlower = [];		// 花牌
    this.cnFlower = 0;			// 花牌个数
    this.nQuanWind = 0;			// 圈风
    this.nMenWind = 0;			// 门风
    this.cnShowGroups = 0;		// 吃碰杠的分组数
    this.nWinMode = 0;			// 和牌方式

    for (let i = 0; i < Define.MAXFANS; i++) {
      this.anFans[i] = 0;
    }

    for (let i = 0; i < 6; i++) {
      this.asGroup[i] = new Define.stoneGroup();
    }
    for (let i = 0; i < Define.MAX_HAND_COUNT; i++) {
      this.asHandStone[i] = new Define.stoneObj();
    }
    for (let i = 0; i < 8; i++) {
      this.asFlower[i] = new Define.stoneObj();
    }
  }
  
};
//////////////////////////
////////////////////////////
/////////////////////////////

Define._memcpy = function (toobj, toobjidx, fromobj, fromobjidx, len) { //???待定
  if (toobj.constructor == Array && fromobj.constructor == Array) {
    for (let i = 0; i < len; i++) {
      toobj[toobjidx + i] = _.cloneDeep(fromobj[fromobjidx + i]);
    }
  }
  // else if (toobj.constructor == Array) {
  //   for (let i = 0; i < len; i++) {
  //     toobj[toobjidx] = _.cloneDeep(fromobj);
  //   }
  // }
  // else {
  //   toobj = _.cloneDeep(fromobj);
  // }
}

Define.buHuaMsg = function () {
  
}