let Define = require('../base/commonDefine');
let CQuadrantTree = require('./QuadrantTree');
const _ = require('lodash');
let stoneObj = Define.stoneObj;
let stc_pszFanName =
  [
    "大四喜", "大三元", "绿一色", "九莲宝灯", "四杠", "连七对", "十三幺", "清幺九", "小四喜", "小三元", "字一色", "四暗刻", "一色双龙会", "一色四同顺", "一色四节高",
    "一色四步高", "三杠", "混幺九", "七小对", "七星不靠", "全双刻", "清一色", "一色三同顺", "一色三节高", "全大", "全中", "全小", "青龙", "三色双龙会", "一色三步高", "全带五", "三同刻",
    "三暗刻", "全不靠", "组合龙", "大于五", "小于五", "三风刻", "花龙", "推不倒", "三色三同顺", "三色三节高", "无番和", "妙手回春", "海底捞月", "杠上开花",
    "抢杠和", "碰碰和", "混一色", "三色三步高", "五门齐", "全求人", "双暗杠", "双箭刻", "全带幺", "不求人", "双明杠", "和绝张", "箭刻", "圈风刻", "门风刻", "门前清",
    "平和", "四归一", "双同刻", "双暗刻", "暗杠", "断幺九", "一般高", "喜相逢", "连六", "老少配", "幺九刻", "明杠", "缺一门", "无字", "边张", "坎张", "单钓将",
    "自摸", "花牌", "四方大发财", "天和", "地和", "人和", "混杠", "八仙过海", "七抢一", "天听", "混四节", "混四步", "混三节", "无混", "混龙", "混三步", "立直",
    "二五八将", "梅兰竹菊", "春夏秋冬", "季花", "么九头"
  ];


CJudge = function () {

  this.m_cnMaxHandStone = 0;// 手中最多能有几张牌
  this.m_cnMaxGroups = 0;// 最多能分为几个分组
  this.m_cnMaxFans = 0;// 本规则最大番种个数
  // 算番入口集
  this.m_avFansEntry = [];
  this.m_asFanInfo = [];// 番种列表
  this.m_asAllStone = [];// 保存34种牌，用于验听
  // 所有分组的统计信息
  this.m_sGroupsRelation = "";// 所有分组的统计信息
  this.m_abEnableRule = new Array(Define.MAXFANS);

  this.m_sStonesRelation = new Define.stoneRelation();// 手中牌的统计信息

  // Doc类传过来的参数
  this.m_pCheckParam = new Define.checkParam();
  // 算番结果
  this.m_sHuResult = new Define.huresult();

  // 当前使用的规则
  this.m_eRule = 0;

  // 是否有混牌
  this.m_bHasHun = false;

  // 混牌ID
  this.m_nHunID = {};
  //let m_nHunID[2];

  this.m_checkfans = [];//需要检查的翻型列表

  //
  this.m_sOriginalStoneRelation = new Define.stoneRelation();

};
CJudge.create = function (rule) {
  rule = undefined == rule ? 0 : rule;
  let obj = new CJudge();
  obj.m_eRule = rule;
  obj.m_nHunID = {
    nID: 0,		// 麻将牌的ID号（唯一）
    nColor: 0,		// 麻将牌的花色
    nWhat: 0		// 麻将牌的点数};
  }
  return obj;
}
// 初始化，构造之后必须调用本函数
CJudge.prototype.Init = function () {
  this.m_cnMaxHandStone = 14;
  this.m_cnMaxGroups = 5;
  this.m_cnMaxFans = 81;
  for (let i = 0; i < 9; i++) {
    this.m_avFansEntry[i] = [];
    for (let j = 0; j < 6; j++) {
      this.m_avFansEntry[i][j] = [];
    }
  }
  for (let i = 0; i < Define.MAXFANS; i++) {
    //this.m_asFanInfo[i]=new FAN();
    this.m_asFanInfo[i] = { nScore: 0, fCheck: "", fParse: "" };
  }
  for (let i = 0; i < 34; i++) {
    this.m_asAllStone[i] = new stoneObj();
  }

  // 初始化番种列表
  for (let i = 0; i < 81; i++) {
    // 国标的番种
    if (i < 7) {
      this.m_asFanInfo[i].nScore = 88;
    }
    else if (i < 13) {
      this.m_asFanInfo[i].nScore = 64;
    }
    else if (i < 15) {
      this.m_asFanInfo[i].nScore = 48;
    }
    else if (i < 18) {
      this.m_asFanInfo[i].nScore = 32;
    }
    else if (i < 27) {
      this.m_asFanInfo[i].nScore = 24;
    }
    else if (i < 33) {
      this.m_asFanInfo[i].nScore = 16;
    }
    else if (i < 38) {
      this.m_asFanInfo[i].nScore = 12;
    }
    else if (i < 47) {
      this.m_asFanInfo[i].nScore = 8;
    }
    else if (i < 54) {
      this.m_asFanInfo[i].nScore = 6;
    }
    else if (i < 58) {
      this.m_asFanInfo[i].nScore = 4;
    }
    else if (i < 68) {
      this.m_asFanInfo[i].nScore = 2;
    }
    else {
      this.m_asFanInfo[i].nScore = 1;
    }
  }

  // 大众添加的番种
  this.m_asFanInfo[Define.FAN_4FANGDAFA].nScore = 168;
  this.m_asFanInfo[Define.FAN_TIANHU].nScore = 168;
  this.m_asFanInfo[Define.FAN_DIHU].nScore = 158;
  this.m_asFanInfo[Define.FAN_RENHU].nScore = 108;
  this.m_asFanInfo[Define.FAN_HUNGANG].nScore = 88;
  this.m_asFanInfo[Define.FAN_8XIANGUOHAI].nScore = 88;
  this.m_asFanInfo[Define.FAN_7QIANG1].nScore = 32;
  this.m_asFanInfo[Define.FAN_TIANTING].nScore = 32;
  this.m_asFanInfo[Define.FAN_HUN4JIE].nScore = 6;
  this.m_asFanInfo[Define.FAN_HUN4BU].nScore = 4;
  this.m_asFanInfo[Define.FAN_HUN3JIE].nScore = 4;
  this.m_asFanInfo[Define.FAN_WUHUN].nScore = 2;
  this.m_asFanInfo[Define.FAN_HUNLONG].nScore = 2;
  this.m_asFanInfo[Define.FAN_HUN3BU].nScore = 2;
  this.m_asFanInfo[Define.FAN_LIZHI].nScore = 2;
  this.m_asFanInfo[Define.FAN_258JONG].nScore = 1;
  this.m_asFanInfo[Define.FAN_4FLOWER].nScore = 1;
  this.m_asFanInfo[Define.FAN_4SEASON].nScore = 1;
  this.m_asFanInfo[Define.FAN_SEASONFLOWER].nScore = 1;
  this.m_asFanInfo[Define.FAN_19JONG].nScore = 1;

  // 回调函数
  this.m_asFanInfo[Define.FAN_DA4XI].fCheck = this.CheckDa4Xi;
  this.m_asFanInfo[Define.FAN_DA3YUAN].fCheck = this.CheckDa3Yuan;
  this.m_asFanInfo[Define.FAN_LVYISHE].fCheck = this.CheckLv1She;
  this.m_asFanInfo[Define.FAN_9LIANBAODEN].fCheck = this.Check9LianBaoDen;
  this.m_asFanInfo[Define.FAN_4GANG].fCheck = this.Check4Gang;
  this.m_asFanInfo[Define.FAN_LIAN7DUI].fCheck = this.CheckLian7Dui;
  this.m_asFanInfo[Define.FAN_131].fCheck = this.Check131;
  this.m_asFanInfo[Define.FAN_QING19].fCheck = this.CheckQing19;
  this.m_asFanInfo[Define.FAN_XIAO4XI].fCheck = this.CheckXiao4Xi;
  this.m_asFanInfo[Define.FAN_XIAO3YUAN].fCheck = this.CheckXiao3Yuan;
  this.m_asFanInfo[Define.FAN_ZI1SHE].fCheck = this.CheckZi1She;
  this.m_asFanInfo[Define.FAN_4ANKE].fCheck = this.Check4AnKe;
  this.m_asFanInfo[Define.FAN_1SHE2GLONG].fCheck = this.Check1She2Long;
  this.m_asFanInfo[Define.FAN_1SHE4TONGSHUN].fCheck = this.Check1She4TongShun;
  this.m_asFanInfo[Define.FAN_1SHE4JIEGAO].fCheck = this.Check1She4JieGao;
  this.m_asFanInfo[Define.FAN_1SHE4BUGAO].fCheck = this.Check1She4BuGao;
  this.m_asFanInfo[Define.FAN_3GANG].fCheck = this.Check3Gang;
  this.m_asFanInfo[Define.FAN_HUN19].fCheck = this.CheckHun19;
  this.m_asFanInfo[Define.FAN_7DUI].fCheck = this.Check7Dui;
  this.m_asFanInfo[Define.FAN_7XINBUKAO].fCheck = this.Check7XinBuKao;
  this.m_asFanInfo[Define.FAN_QUANSHUANGKE].fCheck = this.CheckQuanShuangKe;
  this.m_asFanInfo[Define.FAN_QING1SHE].fCheck = this.CheckQing1She;
  this.m_asFanInfo[Define.FAN_1SHE3TONGSHUN].fCheck = this.Check1She3TongShun;
  this.m_asFanInfo[Define.FAN_1SHE3JIEGAO].fCheck = this.Check1She3JieGao;
  this.m_asFanInfo[Define.FAN_QUANDA].fCheck = this.CheckQuanDa;
  this.m_asFanInfo[Define.FAN_QUANZHONG].fCheck = this.CheckQuanZhong;
  this.m_asFanInfo[Define.FAN_QUANXIAO].fCheck = this.CheckQuanXiao;
  this.m_asFanInfo[Define.FAN_QINGLONG].fCheck = this.CheckQingLong;
  this.m_asFanInfo[Define.FAN_3SHE2LONG].fCheck = this.Check3She2Long;
  this.m_asFanInfo[Define.FAN_1SHE3BUGAO].fCheck = this.Check1She3BuGao;
  this.m_asFanInfo[Define.FAN_QUANDAI5].fCheck = this.CheckQuanDai5;
  this.m_asFanInfo[Define.FAN_3TONGKE].fCheck = this.Check3TongKe;
  this.m_asFanInfo[Define.FAN_3ANKE].fCheck = this.Check3AnKe;
  this.m_asFanInfo[Define.FAN_QUANBUKAO].fCheck = this.CheckQuanBuKao;
  this.m_asFanInfo[Define.FAN_ZHUHELONG].fCheck = this.CheckZhuHeLong;
  this.m_asFanInfo[Define.FAN_DAYU5].fCheck = this.CheckDaYu5;
  this.m_asFanInfo[Define.FAN_XIAOYU5].fCheck = this.CheckXiaoYu5;
  this.m_asFanInfo[Define.FAN_3FENGKE].fCheck = this.Check3FengKe;
  this.m_asFanInfo[Define.FAN_HUALONG].fCheck = this.CheckHuaLong;
  this.m_asFanInfo[Define.FAN_TUIBUDAO].fCheck = this.CheckTuiBuDao;
  this.m_asFanInfo[Define.FAN_3SHE3TONGSHUN].fCheck = this.Check3She3TongShun;
  this.m_asFanInfo[Define.FAN_3SHEJIEJIEGAO].fCheck = this.Check3She3JieGao;
  this.m_asFanInfo[Define.FAN_WUFAN].fCheck = this.CheckWuFan;
  this.m_asFanInfo[Define.FAN_MIAOSHOU].fCheck = this.CheckMiaoShou;
  this.m_asFanInfo[Define.FAN_HAIDI].fCheck = this.CheckHaiDi;
  this.m_asFanInfo[Define.FAN_GANGHU].fCheck = this.CheckGangHu;
  this.m_asFanInfo[Define.FAN_QIANGGANG].fCheck = this.CheckQiangGang;
  this.m_asFanInfo[Define.FAN_PENPENHU].fCheck = this.CheckPenPenHu;
  this.m_asFanInfo[Define.FAN_HUN1SHE].fCheck = this.CheckHun1She;
  this.m_asFanInfo[Define.FAN_3SHE3BUGAO].fCheck = this.Check3She3BuGao;
  this.m_asFanInfo[Define.FAN_5MENQI].fCheck = this.Check5MenQi;
  this.m_asFanInfo[Define.FAN_QUANQIUREN].fCheck = this.CheckQuanQiuRen;
  this.m_asFanInfo[Define.FAN_2ANGANG].fCheck = this.Check2AnGang;
  this.m_asFanInfo[Define.FAN_2JIANKE].fCheck = this.Check2JianKe;
  this.m_asFanInfo[Define.FAN_QUANDAIYAO].fCheck = this.CheckQuanDai1;
  this.m_asFanInfo[Define.FAN_BUQIUREN].fCheck = this.CheckBuQiuRen;
  this.m_asFanInfo[Define.FAN_2MINGANG].fCheck = this.Check2MinGang;
  this.m_asFanInfo[Define.FAN_HUJUEZHANG].fCheck = this.CheckHuJueZhang;
  this.m_asFanInfo[Define.FAN_JIANKE].fCheck = this.CheckJianKe;
  this.m_asFanInfo[Define.FAN_QUANFENG].fCheck = this.CheckQuanFeng;
  this.m_asFanInfo[Define.FAN_MENGFENG].fCheck = this.CheckMenFeng;
  this.m_asFanInfo[Define.FAN_MENGQING].fCheck = this.CheckMenQing;
  this.m_asFanInfo[Define.FAN_PINHU].fCheck = this.CheckPinHu;
  this.m_asFanInfo[Define.FAN_4GUI1].fCheck = this.Check4Gui1;
  this.m_asFanInfo[Define.FAN_2TONGKE].fCheck = this.Check2TongKe;
  this.m_asFanInfo[Define.FAN_2ANKE].fCheck = this.Check2AnKe;
  this.m_asFanInfo[Define.FAN_ANGANG].fCheck = this.CheckAnGang;
  this.m_asFanInfo[Define.FAN_DUAN19].fCheck = this.CheckDuan19;
  this.m_asFanInfo[Define.FAN_YIBANGAO].fCheck = this.CheckYiBanGao;
  this.m_asFanInfo[Define.FAN_XIXIANGFENG].fCheck = this.CheckXiXiangFeng;
  this.m_asFanInfo[Define.FAN_LIAN6].fCheck = this.CheckLian6;
  this.m_asFanInfo[Define.FAN_LAOSHAOFU].fCheck = this.CheckLaoShaoFu;
  this.m_asFanInfo[Define.FAN_19KE].fCheck = this.Check19Ke;
  this.m_asFanInfo[Define.FAN_MINGANG].fCheck = this.CheckMinGang;
  this.m_asFanInfo[Define.FAN_QUE1MEN].fCheck = this.CheckQue1Men;
  this.m_asFanInfo[Define.FAN_WUZI].fCheck = this.CheckWuZi;
  this.m_asFanInfo[Define.FAN_BIANZANG].fCheck = this.CheckBianZang;
  this.m_asFanInfo[Define.FAN_KANZANG].fCheck = this.CheckKanZang;
  this.m_asFanInfo[Define.FAN_DANDIAO].fCheck = this.CheckDanDiao;
  this.m_asFanInfo[Define.FAN_ZIMO].fCheck = this.CheckZiMo;
  this.m_asFanInfo[Define.FAN_FLOWER].fCheck = this.undefinedfan;

  // 大众添加的番种
  this.m_asFanInfo[Define.FAN_4FANGDAFA].fCheck = this.Check4FangDaFa;
  this.m_asFanInfo[Define.FAN_TIANHU].fCheck = this.undefinedfan;
  this.m_asFanInfo[Define.FAN_DIHU].fCheck = this.undefinedfan;
  this.m_asFanInfo[Define.FAN_RENHU].fCheck = this.undefinedfan;
  this.m_asFanInfo[Define.FAN_HUNGANG].fCheck = this.CheckHunGang;
  this.m_asFanInfo[Define.FAN_8XIANGUOHAI].fCheck = this.Check8Xian;
  this.m_asFanInfo[Define.FAN_7QIANG1].fCheck = this.Check7Qiang1;
  this.m_asFanInfo[Define.FAN_TIANTING].fCheck = "";
  this.m_asFanInfo[Define.FAN_HUN4JIE].fCheck = this.CheckHun4Jie;
  this.m_asFanInfo[Define.FAN_HUN4BU].fCheck = this.CheckHun4Bu;
  this.m_asFanInfo[Define.FAN_HUN3JIE].fCheck = this.CheckHun3Jie;
  this.m_asFanInfo[Define.FAN_WUHUN].fCheck = this.CheckWuHun;
  this.m_asFanInfo[Define.FAN_HUNLONG].fCheck = this.CheckHunLong;
  this.m_asFanInfo[Define.FAN_HUN3BU].fCheck = this.CheckHun3Bu;
  this.m_asFanInfo[Define.FAN_LIZHI].fCheck = this.CheckLiZhi;
  this.m_asFanInfo[Define.FAN_258JONG].fCheck = this.Check258Jong;
  this.m_asFanInfo[Define.FAN_4FLOWER].fCheck = this.Check4Flower;
  this.m_asFanInfo[Define.FAN_4SEASON].fCheck = this.Check4Season;
  this.m_asFanInfo[Define.FAN_SEASONFLOWER].fCheck = this.CheckSeasonFlower;
  this.m_asFanInfo[Define.FAN_19JONG].fCheck = this.Check19Jong;

  // 番种分析的回调函数
  this.m_asFanInfo[Define.FAN_DA4XI].fParse = this.ParseDa4Xi;
  this.m_asFanInfo[Define.FAN_DA3YUAN].fParse = this.ParseDa3Yuan;
  this.m_asFanInfo[Define.FAN_LVYISHE].fParse = this.ParseLv1She;
  this.m_asFanInfo[Define.FAN_9LIANBAODEN].fParse = this.Parse9LianBaoDeng;
  this.m_asFanInfo[Define.FAN_4GANG].fParse = this.Parse4Gang;
  this.m_asFanInfo[Define.FAN_LIAN7DUI].fParse = this.ParseLian7Dui;
  this.m_asFanInfo[Define.FAN_131].fParse = this.Parse13Yao;
  this.m_asFanInfo[Define.FAN_QING19].fParse = this.ParseQing19;
  this.m_asFanInfo[Define.FAN_XIAO4XI].fParse = this.ParseXiao4Xi;
  this.m_asFanInfo[Define.FAN_XIAO3YUAN].fParse = this.ParseXiao3Yuan;
  this.m_asFanInfo[Define.FAN_ZI1SHE].fParse = this.ParseZi1She;
  this.m_asFanInfo[Define.FAN_4ANKE].fParse = this.Parse4AnKe;
  this.m_asFanInfo[Define.FAN_1SHE2GLONG].fParse = this.Parse1She2Long;
  this.m_asFanInfo[Define.FAN_1SHE4TONGSHUN].fParse = this.Parse1She4TongShun;
  this.m_asFanInfo[Define.FAN_1SHE4JIEGAO].fParse = this.Parse1She4JieGao;
  this.m_asFanInfo[Define.FAN_1SHE4BUGAO].fParse = this.Parse1She4BuGao;
  this.m_asFanInfo[Define.FAN_3GANG].fParse = this.Parse3Gang;
  this.m_asFanInfo[Define.FAN_HUN19].fParse = this.ParseHun19;
  this.m_asFanInfo[Define.FAN_7DUI].fParse = this.Parse7Dui;
  this.m_asFanInfo[Define.FAN_7XINBUKAO].fParse = this.Parse7XinBuKao;
  this.m_asFanInfo[Define.FAN_QUANSHUANGKE].fParse = this.ParseQuan2Ke;
  this.m_asFanInfo[Define.FAN_QING1SHE].fParse = this.ParseQing1She;
  this.m_asFanInfo[Define.FAN_1SHE3TONGSHUN].fParse = this.Parse1She3TongShun;
  this.m_asFanInfo[Define.FAN_1SHE3JIEGAO].fParse = this.Parse1She3JieGao;
  this.m_asFanInfo[Define.FAN_QUANDA].fParse = this.ParseQuanDa;
  this.m_asFanInfo[Define.FAN_QUANZHONG].fParse = this.ParseQuanZhong;
  this.m_asFanInfo[Define.FAN_QUANXIAO].fParse = this.ParseQuanXiao;
  this.m_asFanInfo[Define.FAN_QINGLONG].fParse = this.ParseQingLong;
  this.m_asFanInfo[Define.FAN_3SHE2LONG].fParse = this.Parse3She2Long;
  this.m_asFanInfo[Define.FAN_1SHE3BUGAO].fParse = this.Parse1She3BuGao;
  this.m_asFanInfo[Define.FAN_QUANDAI5].fParse = this.ParseQuanDai5;
  this.m_asFanInfo[Define.FAN_3TONGKE].fParse = this.Parse3TongKe;
  this.m_asFanInfo[Define.FAN_3ANKE].fParse = this.Parse3AnKe;
  this.m_asFanInfo[Define.FAN_QUANBUKAO].fParse = this.ParseQuanBuKao;
  this.m_asFanInfo[Define.FAN_ZHUHELONG].fParse = this.ParseZhuHeLong;
  this.m_asFanInfo[Define.FAN_DAYU5].fParse = this.ParseDaYu5;
  this.m_asFanInfo[Define.FAN_XIAOYU5].fParse = this.ParseXiaoYu5;
  this.m_asFanInfo[Define.FAN_3FENGKE].fParse = this.Parse3FengKe;
  this.m_asFanInfo[Define.FAN_HUALONG].fParse = this.ParseHuaLong;
  this.m_asFanInfo[Define.FAN_TUIBUDAO].fParse = this.ParseTuiBuDao;
  this.m_asFanInfo[Define.FAN_3SHE3TONGSHUN].fParse = this.Parse3She3TongShun;
  this.m_asFanInfo[Define.FAN_3SHEJIEJIEGAO].fParse = this.Parse3She3JieGao;
  this.m_asFanInfo[Define.FAN_WUFAN].fParse = this.ParseWuFan;
  this.m_asFanInfo[Define.FAN_MIAOSHOU].fParse = this.ParseMiaoShou;
  this.m_asFanInfo[Define.FAN_HAIDI].fParse = this.ParseHaiDi;
  this.m_asFanInfo[Define.FAN_GANGHU].fParse = this.ParseGangKai;
  this.m_asFanInfo[Define.FAN_QIANGGANG].fParse = this.ParseQiangGang;
  this.m_asFanInfo[Define.FAN_PENPENHU].fParse = this.ParsePenPenHu;
  this.m_asFanInfo[Define.FAN_HUN1SHE].fParse = this.ParseHun1She;
  this.m_asFanInfo[Define.FAN_3SHE3BUGAO].fParse = this.Parse3She3BuGao;
  this.m_asFanInfo[Define.FAN_5MENQI].fParse = this.Parse5MenQi;
  this.m_asFanInfo[Define.FAN_QUANQIUREN].fParse = this.ParseQuanQiuRen;
  this.m_asFanInfo[Define.FAN_2ANGANG].fParse = this.Parse2AnGang;
  this.m_asFanInfo[Define.FAN_2JIANKE].fParse = this.Parse2JianKe;
  this.m_asFanInfo[Define.FAN_QUANDAIYAO].fParse = this.ParseQuan1;
  this.m_asFanInfo[Define.FAN_BUQIUREN].fParse = this.ParseBuQiuRen;
  this.m_asFanInfo[Define.FAN_2MINGANG].fParse = this.Parse2MinGang;
  this.m_asFanInfo[Define.FAN_HUJUEZHANG].fParse = this.ParseHuJueZhang;
  this.m_asFanInfo[Define.FAN_JIANKE].fParse = this.ParseJianKe;
  this.m_asFanInfo[Define.FAN_QUANFENG].fParse = this.ParseQuanFeng;
  this.m_asFanInfo[Define.FAN_MENGFENG].fParse = this.ParseMenFeng;
  this.m_asFanInfo[Define.FAN_MENGQING].fParse = this.ParseMenQing;
  this.m_asFanInfo[Define.FAN_PINHU].fParse = this.ParsePinHu;
  this.m_asFanInfo[Define.FAN_4GUI1].fParse = this.Parse4Gui1;
  this.m_asFanInfo[Define.FAN_2TONGKE].fParse = this.Parse2TongKe;
  this.m_asFanInfo[Define.FAN_2ANKE].fParse = this.Parse2AnKe;
  this.m_asFanInfo[Define.FAN_ANGANG].fParse = this.ParseAnGang;
  this.m_asFanInfo[Define.FAN_DUAN19].fParse = this.ParseDuan19;
  this.m_asFanInfo[Define.FAN_YIBANGAO].fParse = this.ParseYiBanGao;
  this.m_asFanInfo[Define.FAN_XIXIANGFENG].fParse = this.ParseXiXiangFeng;
  this.m_asFanInfo[Define.FAN_LIAN6].fParse = this.ParseLian6;
  this.m_asFanInfo[Define.FAN_LAOSHAOFU].fParse = this.ParseLaoShaoFu;
  this.m_asFanInfo[Define.FAN_19KE].fParse = this.Parse19Ke;
  this.m_asFanInfo[Define.FAN_MINGANG].fParse = this.ParseMinGang;
  this.m_asFanInfo[Define.FAN_QUE1MEN].fParse = this.ParseQue1Meng;
  this.m_asFanInfo[Define.FAN_WUZI].fParse = this.ParseWuZi;
  this.m_asFanInfo[Define.FAN_BIANZANG].fParse = this.ParseBianZang;
  this.m_asFanInfo[Define.FAN_KANZANG].fParse = this.ParseKanZang;
  this.m_asFanInfo[Define.FAN_DANDIAO].fParse = this.ParseDanDiao;
  this.m_asFanInfo[Define.FAN_ZIMO].fParse = this.ParseZiMo;
  this.m_asFanInfo[Define.FAN_FLOWER].fParse = this.ParseHua;
  this.m_asFanInfo[Define.FAN_4FANGDAFA].fParse = this.Parse4FangDaFa;
  this.m_asFanInfo[Define.FAN_TIANHU].fParse = this.ParseTianHu;
  this.m_asFanInfo[Define.FAN_DIHU].fParse = this.ParseDiHu;
  this.m_asFanInfo[Define.FAN_RENHU].fParse = this.ParseRenHu;
  this.m_asFanInfo[Define.FAN_HUNGANG].fParse = this.ParseHunGang;
  this.m_asFanInfo[Define.FAN_8XIANGUOHAI].fParse = this.Parse8Xian;
  this.m_asFanInfo[Define.FAN_7QIANG1].fParse = this.Parse7Qiang1;
  this.m_asFanInfo[Define.FAN_TIANTING].fParse = this.ParseTianTing;
  this.m_asFanInfo[Define.FAN_HUN4JIE].fParse = this.ParseHun4Jie;
  this.m_asFanInfo[Define.FAN_HUN4BU].fParse = this.ParseHun4Bu;
  this.m_asFanInfo[Define.FAN_HUN3JIE].fParse = this.ParseHun3Jie;
  this.m_asFanInfo[Define.FAN_WUHUN].fParse = this.ParseWuHun;
  this.m_asFanInfo[Define.FAN_HUNLONG].fParse = this.ParseHunLong;
  this.m_asFanInfo[Define.FAN_HUN3BU].fParse = this.ParseHun3Bu;
  this.m_asFanInfo[Define.FAN_LIZHI].fParse = this.ParseLiZhi;
  this.m_asFanInfo[Define.FAN_258JONG].fParse = this.Parse258Jong;
  this.m_asFanInfo[Define.FAN_4FLOWER].fParse = this.Parse4Flower;
  this.m_asFanInfo[Define.FAN_4SEASON].fParse = this.Parse4Season;
  this.m_asFanInfo[Define.FAN_SEASONFLOWER].fParse = this.ParseJiHua;
  this.m_asFanInfo[Define.FAN_19JONG].fParse = this.Parse19Jong;

  // 生成34张牌, 这34张牌的编号
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 9; j++) {
      this.m_asAllStone[i * 9 + j].nColor = i;
      this.m_asAllStone[i * 9 + j].nWhat = j;
      this.m_asAllStone[i * 9 + j].nID = (i << 8) + (j << 4) + 0x0f;
    }
  }
  for (let i = 27; i < 31; i++) {
    this.m_asAllStone[i].nColor = Define.COLOR_WIND;
    this.m_asAllStone[i].nWhat = i - 27;
    this.m_asAllStone[i].nID = (Define.COLOR_WIND << 8) + ((i - 27) << 4) + 0x0f;
  }
  for (let i = 31; i < 34; i++) {
    this.m_asAllStone[i].nColor = Define.COLOR_JIAN;
    this.m_asAllStone[i].nWhat = i - 31;
    this.m_asAllStone[i].nID = (Define.COLOR_JIAN << 8) + ((i - 31) << 4) + 0x0f;
  }

  return true;
}

CJudge.prototype.undefinedfan = function (sHuResult, that) {
  return 0;
}

//88番
// **************************************************************************************
//
//1 大四喜 由4副风刻(杠)组成的和牌。不计圈风刻、门风刻、三风刻、碰碰和、小四喜、幺九刻
//
// **************************************************************************************
CJudge.prototype.CheckDa4Xi = function (sHuResult, that) {
  for (let i = 0; i < 4; i++) {
    if (that.m_sGroupsRelation.acnKeGroups[Define.COLOR_WIND][i] != 1) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_QUANFENG] = false;
  that.m_abEnableRule[Define.FAN_MENGFENG] = false;
  that.m_abEnableRule[Define.FAN_3FENGKE] = false;
  that.m_abEnableRule[Define.FAN_PENPENHU] = false;
  that.m_abEnableRule[Define.FAN_XIAO4XI] = false;
  that.m_abEnableRule[Define.FAN_19KE] = false;

  return 1;
}

// **************************************************************************************
//
//2 大三元 和牌中，有中发白3副刻子。不计箭刻、双箭刻、小三元
//
// **************************************************************************************
CJudge.prototype.CheckDa3Yuan = function (sHuResult, that) {
  for (let i = 0; i < 3; i++) {
    if (that.m_sGroupsRelation.acnKeGroups[Define.COLOR_JIAN][i] != 1) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_JIANKE] = false;
  that.m_abEnableRule[Define.FAN_2JIANKE] = false;
  that.m_abEnableRule[Define.FAN_XIAO3YUAN] = false;

  return 1;
}

// **************************************************************************************
//
//3 绿一色 由23468条及发字中的任何牌组成的顺子、刻子、将的和牌。不计混一色。如无“发”字
// 组成的各牌，可计清一色
// 在算此番之前必须已确定是清一色或混一色
//
// **************************************************************************************
CJudge.prototype.CheckLv1She = function (sHuResult, that) {
  let acnMaxStones = [0, 0, 0, 0, 0, 0, 0, 0, 0, //万
    0, 8, 8, 8, 0, 8, 0, 8, 0, //条
    0, 0, 0, 0, 0, 0, 0, 0, 0, //饼
    0, 0, 0, 0,				// 风
    0, 8, 0];					// 箭
  for (let i = 0; i < 34; i++) {
    if (that.m_sStonesRelation.acnAllStones[i] > acnMaxStones[i]) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_HUN1SHE] = false;

  return 1;
}

// **************************************************************************************
//
// 是否混牌
//
// **************************************************************************************
CJudge.prototype.IsHun = function (sStone) {
  //return false;
  return sStone.nID != 0 && (this.m_nHunID.nColor == sStone.nColor && this.m_nHunID.nWhat == sStone.nWhat);
}

// **************************************************************************************
//
//4 九莲宝灯 由一种花色序数牌子按1112345678999组成的特定牌型，见同花色任何1张序数牌即成和
// 牌。不计清一色、无字
// 在算此番之前必须已确定是清一色
// 不计门前清 缺一门、幺九刻、不求人
//
// **************************************************************************************
CJudge.prototype.Check9LianBaoDen = function (sHuResult, that) {
  // 去掉最后摸的那张牌后，1和9必须得是3张，其它每样一张
  if (that.m_pCheckParam.cnShowGroups > 0)//|| that.m_sStonesRelation.cnStoneTypes != 9 )
  {
    // 不能有吃碰杠的牌
    // 九张牌都必须得有
    return 0;
  }

  // 先搜索到最后摸的那张牌的花色和数字
  let sWinTileInfo = new Define.tagTileInfo();
  if (that.IsHun(that.m_pCheckParam.asHandStone[0])) {
    // 如果最后那张是混牌，还要到分组里去搜索，看它变成什么牌了
    that.GetTileInfo(that.m_pCheckParam.asHandStone[0].nID, sHuResult.asGroup, sWinTileInfo);
  }
  else {
    sWinTileInfo.nColor = that.m_pCheckParam.asHandStone[0].nColor;
    sWinTileInfo.nWhat = that.m_pCheckParam.asHandStone[0].nWhat;
  }

  // 遍历一下，是否满足要求
  let cnCorrectCount = 0;// 正确张数
  for (let i = 0; i < 9; i++) {
    if (i == 0 || i == 8) {
      cnCorrectCount = 3;
    }
    else {
      cnCorrectCount = 1;
    }
    if (i == sWinTileInfo.nWhat) {
      cnCorrectCount++;
    }
    if (that.m_sStonesRelation.acnAllStones[sWinTileInfo.nColor * 9 + i] != cnCorrectCount) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_QING1SHE] = false;
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  that.m_abEnableRule[Define.FAN_BUQIUREN] = false;
  that.m_abEnableRule[Define.FAN_MENGQING] = false;
  that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
  that.m_abEnableRule[Define.FAN_19KE] = false;

  return 1;
}

// **************************************************************************************
//
// 设置规则(国标/大众)
//
// **************************************************************************************
CJudge.prototype.SetRule = function (eRule, bHasHun) {
  this.m_eRule = eRule;
  this.m_bHasHun = bHasHun;
}

// **************************************************************************************
//
// 设置混牌
//
// **************************************************************************************
CJudge.prototype.SetHun = function (nHun) {
  this.m_nHunID = nHun;
  //判断其原有代码的混牌判断方式不正确，m_nHunID[2]不会是相同的两张牌，而IsHun
  //		  中的参数却要满足与两张牌相同，这显然并不合理，故而改成使用一张牌作为混牌
  //m_nHunID[0] = nHunID; // chenjian 2007.10.30
  //m_nHunID[1] = nSecondHunID;
}

// **************************************************************************************
//
// 设置混为指定的牌,并修改this.m_sStonesRelation结构
// 只修改算番会用到的成员:acnAllStones,acnAllColors,cnAllColors
//
// **************************************************************************************
CJudge.prototype.UseHun = function (sHunStone, nStoneValue, bAmend) {
  sHunStone.nColor = this.m_asAllStone[nStoneValue].nColor;
  sHunStone.nWhat = this.m_asAllStone[nStoneValue].nWhat;

  if (undefined != bAmend && bAmend) {
    // 要修改this.m_sStonesRelation
    this.m_sStonesRelation.acnAllStones[nStoneValue]++;
    if (this.m_sStonesRelation.acnAllColors[sHunStone.nColor] == 0) {
      this.m_sStonesRelation.cnAllColors++;
    }
    this.m_sStonesRelation.acnAllColors[sHunStone.nColor]++;
    this.m_sStonesRelation.cnHun--;
  }
}

// **************************************************************************************
//
// 设置混为指定的牌
// wm UseHun to UseHuntocard
// **************************************************************************************
CJudge.prototype.UseHuntocard = function (sHunStone, nColor, nWhat) {
  sHunStone.nColor = nColor;
  sHunStone.nWhat = nWhat;
}


// **************************************************************************************
//
// 将手中的牌排序(混牌在最后，其它牌按从小到大排列)
// 和的那张牌如果是混牌，排在所有混的最后面，目的是让它有机会和另一混牌组成将牌
//
// **************************************************************************************
CJudge.prototype.Sort = function (asStone, cnStone) {

  let k = 0;
  let sStone = new stoneObj();

  //if ( this.IsHun( asStone[0] ) )
  //{
  //    // 和的那张牌是混牌，放到最后再说
  //    sStone = _.cloneDeep(asStone[0]);
  //    asStone.splice(0,1);
  //    asStone.push(sStone);
  //}
  for (let i = cnStone - 1; i >= 0; i--) {
    if (this.IsHun(asStone[i]) || (asStone[i].nID == 0 && asStone[i].nColor == 0 && asStone[i].nWhat == 0)) {
      continue;
    }

    k = i;
    for (let j = i - 1; j >= 0; j--) {
      // 混是最大的
      if (this.IsHun(asStone[j])) {
        k = j;
        break;
      }

      if ((asStone[k].nColor << 4) + asStone[k].nWhat
        < (asStone[j].nColor << 4) + asStone[j].nWhat) {
        k = j;
      }
    }
    if (k != i) {
      sStone = asStone[k];
      asStone[k] = asStone[i];
      asStone[i] = sStone;
    }
  }
}

// **************************************************************************************
//
// 验和
//
// **************************************************************************************
CJudge.prototype.CheckWin = function (sCheckParam, sHuResult) {
  this.m_checkfans = [];
  if (this.InvalidParam(sCheckParam)) {
    return Define.F_NOTTING;
  }

  // 将吃碰杠的分组拷到返回结构里
  sHuResult.asGroup = _.cloneDeep(sCheckParam.asShowGroup);
  sHuResult.cnShowGroups = sCheckParam.cnShowGroups;

  // 将传进来的参数暂存一下
  this.m_pCheckParam = sCheckParam;

  // 不能破坏传进来的参数，后面算番还要用到,保存手中的牌
  let asHandStone = [];
  for (let i = 0; i < Define.MAX_HAND_COUNT; i++) {
    asHandStone[i] = new stoneObj();
  }
  asHandStone = _.cloneDeep(sCheckParam.asHandStone);


  //将手中的牌排序(混牌在最后，其它牌按从小到大排列)
  this.Sort(asHandStone, asHandStone.length);

  // 扫描一下牌型
  this.m_sOriginalStoneRelation = new Define.stoneRelation();
  this.GetStonesRelation(asHandStone, sCheckParam.cnHandStone, this.m_sOriginalStoneRelation);

  //this.m_sStonesRelation = this.m_sOriginalStoneRelation;
  let cnNormalStone = sCheckParam.cnHandStone - this.m_sOriginalStoneRelation.cnHun;

  let eRet = Define.F_NOTTING;
  let sHuResultTmp = _.cloneDeep(sHuResult);

  // ************* //
  // 十三幺,全不靠 //
  // ************* //
  console.log("fsfsfsaaaaa" + (cnNormalStone + this.m_sOriginalStoneRelation.cnHun) + ":" + (this.m_sOriginalStoneRelation.cnAllColors + this.m_sOriginalStoneRelation.cnHun)
    + ":" + this.m_sOriginalStoneRelation.cnStoneTypes + ":" + this.m_sOriginalStoneRelation.cnHun + ":" + JSON.stringify(this.m_sOriginalStoneRelation.acnHandStones)
  )
  if (cnNormalStone + this.m_sOriginalStoneRelation.cnHun == 14
    && this.m_sOriginalStoneRelation.cnAllColors + this.m_sOriginalStoneRelation.cnHun >= 5
    && this.m_sOriginalStoneRelation.cnStoneTypes + this.m_sOriginalStoneRelation.cnHun >= 13) {
    // 十三幺,全不靠必须得五门齐
    sHuResultTmp.nResultant = Define.SHISHANYAO;
    eRet = this.CheckThirteenUnios(asHandStone, cnNormalStone, this.m_sOriginalStoneRelation.cnHun, sHuResultTmp, this.m_checkfans);
    if (sHuResultTmp.nMaxFans > sHuResult.nMaxFans) {
      //sHuResult = _.cloneDeep(sHuResultTmp);
      _cpytoobj(sHuResult, sHuResultTmp);
    }
    if (eRet == Define.T_OK) {

      return eRet;
    }

    sHuResultTmp.nResultant = Define.QUANBUKAO;
    if (this.m_sOriginalStoneRelation.cnStoneTypes + this.m_sOriginalStoneRelation.cnHun == 14) {
      let eRetTmp = this.CheckAllLonely(asHandStone, cnNormalStone, this.m_sOriginalStoneRelation.cnHun, sHuResultTmp, this.m_checkfans);
      if (sHuResultTmp.nMaxFans > sHuResult.nMaxFans) {
        //sHuResult = _.cloneDeep(sHuResultTmp);
        _cpytoobj(sHuResult, sHuResultTmp);
      }
      if (eRetTmp == Define.T_OK) {

        return Define.T_OK;
      }
      if (eRetTmp == Define.F_NOENOUGHFANS && eRet == Define.F_NOTTING) {

        eRet = Define.F_NOENOUGHFANS;
      }
    }
  }

  // ********* //
  // 组合龙	 //
  // ********* //
  sHuResultTmp.nResultant = Define.ZUHELONG;

  let eRetTmp = this.CheckZuHeLong(asHandStone, cnNormalStone, this.m_sOriginalStoneRelation.cnHun, sHuResultTmp, this.m_checkfans);
  if (sHuResultTmp.nMaxFans > sHuResult.nMaxFans) {
    //sHuResult = _.cloneDeep(sHuResultTmp);
    _cpytoobj(sHuResult, sHuResultTmp);
  }
  if (eRetTmp == Define.T_OK) {

    // 至少有一种和法
    eRet = Define.T_OK;
  }
  else if (eRetTmp == Define.F_NOENOUGHFANS && eRet == Define.F_NOTTING) {

    // 至少有一种和法，只是番不够
    eRet = Define.F_NOENOUGHFANS;
  }

  // ********* //
  // 七对子	 //
  // ********* //

  sHuResultTmp.nResultant = Define.QIDUI;
  eRetTmp = this.CheckSevenPairs(asHandStone, cnNormalStone, this.m_sOriginalStoneRelation.cnHun, sHuResultTmp, this.m_checkfans);
  if (sHuResultTmp.nMaxFans > sHuResult.nMaxFans) {
    //sHuResult = _.cloneDeep(sHuResultTmp);
    _cpytoobj(sHuResult, sHuResultTmp);
  }
  if (eRetTmp == Define.T_OK) {

    // 至少有一种和法
    eRet = Define.T_OK;
  }
  else if (eRetTmp == Define.F_NOENOUGHFANS && eRet == Define.F_NOTTING) {

    // 至少有一种和法，只是番不够
    eRet = Define.F_NOENOUGHFANS;
  }

  // ********* //
  // 普通牌型	 //
  // ********* //

  //for(let i=0;i<=80;i++){
  //    if(i!=Define.FAN_131 && i!=Define.FAN_QUANBUKAO && i!=Define.FAN_7XINBUKAO && i!=Define.FAN_ZHUHELONG && i!=Define.FAN_7DUI&& i!=Define.FAN_LIAN7DUI){
  //        this.m_checkfans.push(i);
  //    }
  //}
  //this.m_checkfans.sort(function(a,b){
  //    return a-b;
  //});

  sHuResultTmp.nResultant = Define.NORMAL;
  eRetTmp = this.CheckNormal(asHandStone, cnNormalStone, this.m_sOriginalStoneRelation.cnHun, sCheckParam.cnShowGroups, sHuResultTmp);

  if (sHuResultTmp.nMaxFans > sHuResult.nMaxFans) {
    //sHuResult = _.cloneDeep(sHuResultTmp);
    _cpytoobj(sHuResult, sHuResultTmp);

  }
  if (eRetTmp == Define.T_OK) {

    // 至少有一种和法
    eRet = Define.T_OK;
  }
  else if (eRetTmp == Define.F_NOENOUGHFANS && eRet == Define.F_NOTTING) {

    // 至少有一种和法，只是番不够
    eRet = Define.F_NOENOUGHFANS;
  }

  //	if ( eRet == Define.T_OK )
  //	{
  //		if ( sHuResult.nResultant == NORMAL || sHuResult.nResultant == PENPENHU
  //			|| sHuResult.nResultant == ZUHELONG )
  //		{
  //			// 分组数应为
  //			sHuResult.cnGroups = this.m_cnMaxGroups;
  //		}
  //		else if ( sHuResult.nResultant == QIDUI || sHuResult.nResultant == SHISHANYAO
  //			|| sHuResult.nResultant == QUANBUKAO )
  //		{
  //			// 分组数应为牌数
  //			sHuResult.cnGroups = 14;
  //		}
  //	}

  // 加上这个变量主要是为了三暗刻
  //	sHuResult.cnShowGroups = this.m_pCheckParam.cnShowGroups;

  return eRet;
}


// 验听
CJudge.prototype.CheckTing = function (sCheckParam, vsCallInfo) {
  // 初始化
  vsCallInfo = [];

  let cnTryStone = sCheckParam.cnHandStone;	// 尝试打掉的牌张数

  // 将手中的牌排序
  if (sCheckParam.cnHandStone % 3 == 1) {
    // 只有13(或10、7、4、1)张牌时的听牌,传进来的牌少一张，第一个位置是空着的
    this.Sort(sCheckParam.asHandStone + 1, sCheckParam.cnHandStone);
    // 在所有牌的前面加一张特殊的牌进去验和
    sCheckParam.asHandStone[0].nID = 0xCCCC;
    sCheckParam.asHandStone[0].nColor = 0xCCCC;
    sCheckParam.asHandStone[0].nWhat = 0xCCCC;
    sCheckParam.cnHandStone++;
    cnTryStone = 1; // 只要尝试打掉第一张就行了，其它的牌不能打
  }
  else {
    this.Sort(sCheckParam.asHandStone, sCheckParam.asHandStone.length);
  }

  let sCallInfo = new Define.tagCallInfo();
  let eRet = Define.F_NOTTING;

  for (let i = 0; i < cnTryStone; i++) {
    // 用来保存本次结果，清零
    sCallInfo.clear();

    // 每张牌都要试一下
    if (this.IsHun(sCheckParam.asHandStone[i])) {
      // 肯定不可能打混牌出去
      continue;
    }
    //		// 跳过相同的牌
    //		for( let j = i + 1; j < sCheckParam.cnHandStone; j++ )
    //		{
    //			if ( !IsSameStone( sCheckParam.asHandStone[j], sCheckParam.asHandStone[i] ) )
    //			{
    //				break;
    //			}
    //		}
    //		i = j - 1;

    // 将准备替换的那张牌移到第一张的位置
    let sTileBak = _.cloneDeep(sCheckParam.asHandStone[i]);
    sCallInfo.nDiscardTileID = sTileBak.nID;
    // 这里只要将第一张牌移动到准备替换的那张牌所在的位置就行了
    Define._memcpy(sCheckParam.asHandStone, i, sCheckParam.asHandStone, 0, 1);

    let sHuResult = new Define.huresult();
    for (let j = 0; j < 34; j++) {
      if (this.IsHun(this.m_asAllStone[j])) {
        // 混牌不用算进去
        continue;
      }

      // 依次替换成其它的33张牌验和
      sHuResult.clear();
      sCheckParam.asHandStone[0] = this.m_asAllStone[j];

      let eResult = this.CheckWin(sCheckParam, sHuResult);
      if (eResult == Define.T_OK) {
        // 如果有无混这一番，还要看看不计无混是否够，不然有可能出现自摸混牌不能和的情况
        if (sHuResult.nMaxFans - this.m_asFanInfo[Define.FAN_WUHUN].nScore * sHuResult.anFans[Define.FAN_WUHUN]
          - sCheckParam.cnFlower < sCheckParam.nMinFan) {
          // 基本番不够
          eRet = Define.F_NOENOUGHFANS;
        }
        else {
          eRet = eResult;
          // 这张牌也可和
          sCallInfo.asCallTileInfo[sCallInfo.cnCallTile].nCallTileID = this.m_asAllStone[j].nID;
          sCallInfo.asCallTileInfo[sCallInfo.cnCallTile].nFans = sHuResult.nMaxFans;
          sCallInfo.cnCallTile++;
        }
      }
      else if (eResult == Define.F_NOENOUGHFANS && eRet == Define.F_NOTTING) {
        eRet = Define.F_NOENOUGHFANS;
      }
    }

    // 看看打掉本张后是否能听
    if (sCallInfo.cnCallTile != 0) {
      // 能听，加到返回的vector里
      vsCallInfo.push(sCallInfo);
    }

    // 本张检验完了，还原
    Define._memcpy(sCheckParam.asHandStone, 0, sCheckParam.asHandStone, i, 1);
    Define._memcpy(sCheckParam.asHandStone, i, sTileBak, 0, 1);
  }

  return eRet;
}

// **************************************************************************************
//
// 对带混的分组算番
//
// **************************************************************************************
CJudge.prototype.EnumerateHunFans = function (nHunGroupIndex, sHuResult) {

  // 需要在这里变混，而不是在算番的函数里变混
  let sHuResultTmp = _.cloneDeep(sHuResult);
  let eRet = Define.F_NOENOUGHFANS;
  let i = 0;
  let j = 0;
  let bHunGroup = false;
  if (sHuResultTmp.asGroup[nHunGroupIndex].nGroupStyle == Define.GROUP_STYLE_HUN) {
    // 这个分组确实全部是混牌
    bHunGroup = true;
  }
  do {
    // 最后一个分组必然是将
    for (let k = 0; k < sHuResultTmp.asGroup.length; ++k) {
      if (sHuResultTmp.asGroup[k].nGroupStyle == Define.GROUP_STYLE_JONG) {
        if (this.IsHun(sHuResultTmp.asGroup[4].asStone[0])
          && this.IsHun(sHuResultTmp.asGroup[4].asStone[1])) {
          // 两张都是混
          this.UseHun(sHuResultTmp.asGroup[4].asStone[0], i);
          this.UseHun(sHuResultTmp.asGroup[4].asStone[1], i);
          i++;
        }
        else {
          // 只循环一次
          i = 34;
        }
        break;
      }

      //如果没找到将牌，这是一种错误的状态，在debug下报错
      if (sHuResultTmp.asGroup[k].nGroupStyle == 0) {
        i = 34;
      }
    }
    j = 0;
    do {
      if (bHunGroup) {
        if (j < 21) {
          // 把这个分组变成顺
          let nColor = Math.floor(j / 7);
          let nWhat = j % 7;
          this.UseHuntocard(sHuResultTmp.asGroup[nHunGroupIndex].asStone[0], nColor, nWhat);
          this.UseHuntocard(sHuResultTmp.asGroup[nHunGroupIndex].asStone[1], nColor, nWhat + 1);
          this.UseHuntocard(sHuResultTmp.asGroup[nHunGroupIndex].asStone[2], nColor, nWhat + 2);
          sHuResultTmp.asGroup[nHunGroupIndex].nGroupStyle = Define.GROUP_STYLE_SHUN;
        }
        else {
          // 把这个分组变成刻
          this.UseHun(sHuResultTmp.asGroup[nHunGroupIndex].asStone[0], j - 21);
          this.UseHun(sHuResultTmp.asGroup[nHunGroupIndex].asStone[1], j - 21);
          this.UseHun(sHuResultTmp.asGroup[nHunGroupIndex].asStone[2], j - 21);
          sHuResultTmp.asGroup[nHunGroupIndex].nGroupStyle = Define.GROUP_STYLE_KE;
        }
        j++;
      }
      else {

        // 只循环一次
        j = 55;
      }
      if (this.EnumerateFans(sHuResultTmp) == Define.T_OK) {
        eRet = Define.T_OK;
      }
      if (sHuResultTmp.nMaxFans > sHuResult.nMaxFans) {
        //sHuResult = sHuResultTmp;
        for (let key in sHuResultTmp) {
          sHuResult[key] = sHuResultTmp[key];
        }

      }
    } while (j < 55);
  } while (i < 34);

  return eRet;
}

// **************************************************************************************
//
// 算番
//
// **************************************************************************************
CJudge.prototype.EnumerateFans = function (sHuResult) {
  // 初始化sHuResult
  sHuResult.nMaxFans = 0;
  sHuResult.anFans = [];
  // 扫描一下各分组
  //	memset( &this.m_sGroupsRelation, 0, sizeof( groupsRelation ) );
  for (let i = 0; i < Define.MAXFANS; i++) {
    sHuResult.anFans[i] = 0;
    this.m_abEnableRule[i] = 1;
  }
  //	if ( sHuResult.nResultant == ZUHELONG || sHuResult.nResultant == NORMAL )
  //	{
  //		// 碰碰和和普通牌型
  //		GetGroupsInfo( sHuResult.asGroup, this.m_sGroupsRelation, this.m_sStonesRelation );
  //	}
  this.m_sGroupsRelation = new Define.groupsRelation();	//分组的统计信息
  this.m_sStonesRelation = new Define.stoneRelation();	//手中牌的统计信息

  this.GetGroupsInfo(sHuResult, this.m_sGroupsRelation, this.m_sStonesRelation);
  // 1.根据花色信息和顺刻数量决定算番的路径
  let nRow = 0;
  let nCol = 0;
  let sadata = this.GetEntry(sHuResult);
  nRow = sadata.nRow;
  nCol = sadata.nCol;

  let fans = Define.fans[nRow][nCol];
  let mark = false;
  for (let ll = 0; ll < fans.length; ll++) {
    mark = false;
    for (let jj = 0; jj < this.m_checkfans.length; jj++) {
      if (this.m_checkfans[jj] == fans[ll]) {
        mark = true;
        break;
      }
      if (!mark) {
        this.m_checkfans.push(fans[ll]);
      }
    }
  }
  this.m_checkfans.sort(function (a, b) {
    return a - b;
  });

  //for( let i = 0; i < this.m_avFansEntry[nRow][nCol].length; i++ )
  //{
  //    let nFanID = this.m_avFansEntry[nRow][nCol][i];

  for (let i = 0; i < this.m_checkfans.length; i++) {
    let nFanID = this.m_checkfans[i];
    //if ( this.m_eRule == Define.RULE_GB && nFanID > 80 )
    if (nFanID > 80) {
      // ID大于80的是大众麻将的番种
      continue;
    }
    if (this.m_abEnableRule[nFanID]) {
      // 有几个这样的番种
      let cnFans = this.m_asFanInfo[nFanID].fCheck(sHuResult, this);
      if (cnFans != 0) {
        sHuResult.anFans[nFanID] = cnFans;
        sHuResult.nMaxFans += cnFans * this.m_asFanInfo[nFanID].nScore;
      }
    }
  }

  // 2.加上与牌型花色无关的番种
  if (this.m_pCheckParam.nWinMode & Define.WIN_MODE_HAIDI) {
    if (this.m_pCheckParam.nWinMode & Define.WIN_MODE_ZIMO) {
      // 妙手回春
      sHuResult.anFans[Define.FAN_MIAOSHOU] = 1;
      sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_MIAOSHOU].nScore;
      this.m_abEnableRule[Define.FAN_ZIMO] = false;
    }
    else {
      // 海底捞月
      sHuResult.anFans[Define.FAN_HAIDI] = 1;
      sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_HAIDI].nScore;
    }
  }
  // 杠开
  if (this.m_pCheckParam.nWinMode & Define.WIN_MODE_GANGSHANGHU) {
    sHuResult.anFans[Define.FAN_GANGHU] = 1;
    sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_GANGHU].nScore;
    // 不计自摸
    this.m_abEnableRule[Define.FAN_ZIMO] = false;
  }
  // 抢杠
  if (this.m_pCheckParam.nWinMode & Define.WIN_MODE_QIANGGANG) {
    sHuResult.anFans[Define.FAN_QIANGGANG] = 1;
    sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_QIANGGANG].nScore;
    // 不计和决张
    this.m_abEnableRule[Define.FAN_HUJUEZHANG] = false;
  }
  // 和绝张
  if (this.m_abEnableRule[Define.FAN_HUJUEZHANG] && (this.m_pCheckParam.nWinMode & Define.WIN_MODE_HUJUEZHANG)) {
    sHuResult.anFans[Define.FAN_HUJUEZHANG] = 1;
    sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_HUJUEZHANG].nScore;
  }
  // 自摸
  if (this.m_abEnableRule[Define.FAN_ZIMO]) {
    if (this.m_pCheckParam.nWinMode & Define.WIN_MODE_ZIMO) {
      sHuResult.anFans[Define.FAN_ZIMO] = 1;
      sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_ZIMO].nScore;
    }
  }

  if (this.m_eRule == Define.RULE_PUBLIC) {
    //四方大发
    let fans = this.Check4FangDaFa(sHuResult);
    if (fans != 0) {
      sHuResult.anFans[Define.FAN_4FANGDAFA] = fans;
      sHuResult.nMaxFans += fans * this.m_asFanInfo[Define.FAN_4FANGDAFA].nScore;
    }

    // 加上与牌型花色无关的番种(大众)
    // 天和
    if ((this.m_pCheckParam.nWinMode & Define.WIN_MODE_TIANHU) == Define.WIN_MODE_TIANHU) {
      sHuResult.anFans[Define.FAN_TIANHU] = 1;
      sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_TIANHU].nScore;
      this.m_abEnableRule[Define.FAN_TIANTING] = false;
      // 天和不计自摸、不求人
      if (sHuResult.anFans[Define.FAN_ZIMO] != 0) {
        sHuResult.anFans[Define.FAN_ZIMO] = 0;
        sHuResult.nMaxFans -= this.m_asFanInfo[Define.FAN_ZIMO].nScore;
      }
      if (sHuResult.anFans[Define.FAN_BUQIUREN] != 0) {
        sHuResult.anFans[Define.FAN_BUQIUREN] = 0;
        sHuResult.nMaxFans -= this.m_asFanInfo[Define.FAN_BUQIUREN].nScore;
      }
    }
    // 地和
    if ((this.m_pCheckParam.nWinMode & Define.WIN_MODE_DIHU) == Define.WIN_MODE_DIHU) {
      sHuResult.anFans[Define.FAN_DIHU] = 1;
      sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_DIHU].nScore;
      //this.m_abEnableRule[FAN_TIANTING] = false;
      // 地和不计自摸、不求人
      if (sHuResult.anFans[Define.FAN_ZIMO] != 0) {
        sHuResult.anFans[Define.FAN_ZIMO] = 0;
        sHuResult.nMaxFans -= this.m_asFanInfo[Define.FAN_ZIMO].nScore;
      }
      if (sHuResult.anFans[Define.FAN_BUQIUREN] != 0) {
        sHuResult.anFans[Define.FAN_BUQIUREN] = 0;
        sHuResult.nMaxFans -= this.m_asFanInfo[Define.FAN_BUQIUREN].nScore;
      }
    }
    // 人和
    if ((this.m_pCheckParam.nWinMode & Define.WIN_MODE_RENHU) == Define.WIN_MODE_RENHU) {
      sHuResult.anFans[Define.FAN_RENHU] = 1;
      sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_RENHU].nScore;
      //this.m_abEnableRule[FAN_TIANTING] = false;
    }
    // 天听
    if (this.m_abEnableRule[Define.FAN_TIANTING]
      && (this.m_pCheckParam.nWinMode & Define.WIN_MODE_TIANTING) == Define.WIN_MODE_TIANTING) {
      sHuResult.anFans[Define.FAN_TIANTING] = 1;
      sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_TIANTING].nScore;
    }
    // 天地人和，天听都不能计门前清
    if (sHuResult.anFans[Define.FAN_TIANTING] != 0 || sHuResult.anFans[Define.FAN_TIANHU] != 0
      || sHuResult.anFans[Define.FAN_DIHU] != 0 || sHuResult.anFans[Define.FAN_RENHU] != 0) {
      if (sHuResult.anFans[Define.FAN_MENGQING] != 0) {
        sHuResult.anFans[Define.FAN_MENGQING] = 0;
        sHuResult.nMaxFans -= this.m_asFanInfo[Define.FAN_MENGQING].nScore;
      }
    }


    // 八仙过海
    if (this.Check8Xian(sHuResult)) {
      sHuResult.anFans[Define.FAN_8XIANGUOHAI] = 1;
      sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_8XIANGUOHAI].nScore;
    }

    // // "混四节"
    if (this.m_abEnableRule[Define.FAN_HUN4JIE]) {
      let CheckHun4Jiefans = this.CheckHun4Jie(sHuResult);
      if (CheckHun4Jiefans != 0) {
        sHuResult.anFans[Define.FAN_HUN4JIE] = CheckHun4Jiefans;
        sHuResult.nMaxFans += fans * this.m_asFanInfo[Define.FAN_HUN4JIE].nScore;
      }
    }
    // "混四步"
    if (this.m_abEnableRule[Define.FAN_HUN4BU]) {
      let FAN_HUN4BUfans = this.CheckHun4Bu(sHuResult);
      if (FAN_HUN4BUfans != 0) {
        sHuResult.anFans[Define.FAN_HUN4BU] = FAN_HUN4BUfans;
        sHuResult.nMaxFans += fans * this.m_asFanInfo[Define.FAN_HUN4BU].nScore;
      }
    }
    // "混三节"
    if (this.m_abEnableRule[Define.FAN_HUN3JIE]) {
      let FAN_HUN3JIEfans = this.CheckHun3Jie(sHuResult);
      if (FAN_HUN3JIEfans != 0) {
        sHuResult.anFans[Define.FAN_HUN3JIE] = FAN_HUN3JIEfans;
        sHuResult.nMaxFans += fans * this.m_asFanInfo[Define.FAN_HUN3JIE].nScore;
      }
    }

    // "混三步"
    if (this.m_abEnableRule[Define.FAN_HUN3BU]) {
      let FAN_HUN3BUfans = this.CheckHun3Bu(sHuResult);
      if (FAN_HUN3BUfans != 0) {
        sHuResult.anFans[Define.FAN_HUN3BU] = FAN_HUN3BUfans;
        sHuResult.nMaxFans += fans * this.m_asFanInfo[Define.FAN_HUN3BU].nScore;
      }
    }

    //// 七抢一
    // if ( ( this.m_pCheckParam.nWinMode & Define.WIN_MODE_7QIANG1 ) == Define.WIN_MODE_7QIANG1 )
    // {
    //     sHuResult.anFans[Define.FAN_7QIANG1] = 1;
    //     sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_7QIANG1].nScore;
    // }
    //        // 混杠
    //        if ( this.CheckHunGang( sHuResult ) )
    //        {
    //            sHuResult.anFans[Define.FAN_HUNGANG] = 1;
    //            sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_HUNGANG].nScore;
    //        }
    if (sHuResult.nResultant == Define.NORMAL || sHuResult.nResultant == Define.ZUHELONG) {
      // 二五八将
      if (this.Check258Jong(sHuResult)) {
        sHuResult.anFans[Define.FAN_258JONG] = 1;
        sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_258JONG].nScore;
      }
      // 幺九头
      if (this.m_abEnableRule[Define.FAN_19JONG] && this.Check19Jong(sHuResult)) {
        sHuResult.anFans[Define.FAN_19JONG] = 1;
        sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_19JONG].nScore;
      }
    }
  }

  if (sHuResult.nMaxFans == 0) {
    // 无番和
    sHuResult.anFans[Define.FAN_WUFAN] = 1;
    sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_WUFAN].nScore;
  }

  // 如果算出来的番数够，再加上附加番
  if (sHuResult.nMaxFans >= this.m_pCheckParam.nMinFan) {
    //// 花牌
    //if ( this.m_pCheckParam.cnFlower > 0 )
    //{
    //    sHuResult.anFans[Define.FAN_FLOWER] = this.m_pCheckParam.cnFlower;
    //    sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_FLOWER].nScore * this.m_pCheckParam.cnFlower;
    //}
    if (this.m_eRule == Define.RULE_PUBLIC) {
      // 无混
      if (this.CheckWuHun(sHuResult)) {
        sHuResult.anFans[Define.FAN_WUHUN] = 1;
        sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_WUHUN].nScore;
      }
      // 春夏秋冬
      if (this.Check4Season(sHuResult)) {
        sHuResult.anFans[Define.FAN_4SEASON] = 1;
        sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_4SEASON].nScore;
      }
      // 梅兰竹菊
      if (this.Check4Flower(sHuResult)) {
        sHuResult.anFans[Define.FAN_4FLOWER] = 1;
        sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_4FLOWER].nScore;
      }
      // 季花
      let cnSeasonFlower = this.CheckSeasonFlower(sHuResult);
      if (cnSeasonFlower != 0) {
        sHuResult.anFans[Define.FAN_SEASONFLOWER] = cnSeasonFlower;
        sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_SEASONFLOWER].nScore * cnSeasonFlower;
      }
      // 立直
      if (this.CheckLiZhi(sHuResult)) {
        sHuResult.anFans[Define.FAN_LIZHI] = 1;
        sHuResult.nMaxFans += this.m_asFanInfo[Define.FAN_LIZHI].nScore;
      }
    }
    return Define.T_OK;
  }
  // 番数不够，清除本次算番产生的中间结果
  //	sHuResult.nMaxFans = 0;
  //	memset( sHuResult.anFans, 0, sizeof( sHuResult.anFans ) );
  return Define.F_NOENOUGHFANS;
}

// **************************************************************************************
//
// 验证和牌是否有效
//
// **************************************************************************************
CJudge.prototype.CanWin = function (sCheckParam, sWinInfo) {
  // 将传进来的参数暂存一下(这个参数是绝对可靠的)
  this.m_pCheckParam = _.cloneDeep(sCheckParam);

  // 验证sWinInfo的正确性
  if (!this.ValidWinInfo(sCheckParam, sWinInfo)) {
    return false;
  }

  return this.EnumerateFans(sWinInfo) == Define.T_OK;
}

// **************************************************************************************
//
// 是否有效的和牌信息
//
// **************************************************************************************
CJudge.prototype.ValidWinInfo = function (sCheckParam, sWinInfo) {
  // 1.首先要看和牌牌型是否正确
  // 2.其次要看牌数对不对，该玩家有没有这些牌,发过来的牌里有没有重复的
  // 3.再次要看分组是否合法
  let anAppearedTileID = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];	// 已出现过的ID
  let cnAppearedTile = 0;			// 已出现过的ID个数

  if (sWinInfo.nResultant == Define.NORMAL || sWinInfo.nResultant == Define.PENPENHU
    || sWinInfo.nResultant == Define.ZUHELONG) {
    // 分组数应是5
    if (sWinInfo.cnGroups != 5) {
      return false;
    }
    let abAppearedColor = [false, false, false];
    let abAppearedWhat = [false, false, false];	// 这两个变量用于组合龙

    for (let i = 0; i < sWinInfo.cnGroups; i++) {
      // 分组是否合法
      let cnGroupTile = 3;
      switch (sWinInfo.asGroup[i].nGroupStyle) {
        case Define.GROUP_STYLE_SHUN:
          if (!this.IsShun(sWinInfo.asGroup[i].asStone)) {
            return false;
          }
          break;
        case Define.GROUP_STYLE_KE:
          if (!this.Is_Ke(sWinInfo.asGroup[i].asStone)) {
            return false;
          }
          break;
        case Define.GROUP_STYLE_JONG:
          if (!this.IsJong(sWinInfo.asGroup[i].asStone)) {
            return false;
          }
          cnGroupTile = 2;
          break;
        case Define.GROUP_STYLE_ANGANG:
        case Define.GROUP_STYLE_MINGGANG:
          if (!this.IsGang(sWinInfo.asGroup[i].asStone)) {
            return false;
          }
          cnGroupTile = 4;
          break;
        case Define.GROUP_STYLE_LONG:
          if (!this.IsLong(sWinInfo.asGroup[i].asStone)) {
            return false;
          }
          // 还要看看这个龙组是否能和其它龙组组合
          // 上面已检验过花色点数，不会越界
          if (abAppearedColor[sWinInfo.asGroup[i].asStone[0].nColor]) {
            return false;
          }
          abAppearedColor[sWinInfo.asGroup[i].asStone[0].nColor] = true;
          if (abAppearedWhat[sWinInfo.asGroup[i].asStone[0].nWhat % 3]) {
            return false;
          }
          abAppearedWhat[sWinInfo.asGroup[i].asStone[0].nWhat % 3] = true;
          break;
        default:
          return false;
      }

      // 所有牌必须得有效
      for (let j = 0; j < cnGroupTile; j++) {
        if (!this.ValidTile(sWinInfo.asGroup[i].asStone[j], sCheckParam,
          anAppearedTileID, cnAppearedTile)) {
          return false;
        }
      }
    }
  }
  else if (sWinInfo.nResultant == Define.QIDUI || sWinInfo.nResultant == Define.SHISHANYAO
    || sWinInfo.nResultant == Define.QUANBUKAO) {
    // 分组数应是14
    if (sWinInfo.cnGroups != 14) {
      return false;
    }

    // 所有牌必须得有效
    for (let i = 0; i < sWinInfo.cnGroups; i++) {
      if (!this.ValidTile(sWinInfo.asHandStone[i], sCheckParam, anAppearedTileID, cnAppearedTile)) {
        return false;
      }
    }

    // 分组得合理
    if (sWinInfo.nResultant == Define.QIDUI) {
      // 七对
      // 先排序
      let k = 0;
      for (let i = 0; i < 13; i++) {
        k = i;
        let j = 0;
        for (j = i + 1; j < 14; j++) {
          if (this.GetValue(sWinInfo.asHandStone[k]) > this.GetValue(sWinInfo.asHandStone[j])) {
            k = j;
          }
        }
        if (j != i) {
          let sTile = _.cloneDeep(sWinInfo.asHandStone[k]);
          sWinInfo.asHandStone[k] = _.cloneDeep(sWinInfo.asHandStone[i]);
          sWinInfo.asHandStone[i] = sTile;
        }
      }
      for (let i = 0; i < 7; i += 2) {
        if (sWinInfo.asHandStone[i].nColor != sWinInfo.asHandStone[i + 1].nColor
          || sWinInfo.asHandStone[i].nWhat != sWinInfo.asHandStone[i + 1].nWhat) {
          return false;
        }
      }
    }
    else if (sWinInfo.nResultant == Define.SHISHANYAO) {
      // 十三幺
      if (!this.IsThirteenUnios(sWinInfo.asHandStone)) {
        return false;
      }
    }
    else {
      // 肯定是全不靠
      if (!this.IsAllLonely(sWinInfo.asHandStone)) {
        return false;
      }
    }
  }
  else {
    return false;
  }

  return true;
}

// **************************************************************************************
//
// 检验是否组合龙和法
// 组合龙可有6种组合方案
// 1, 0, 0, 1, 0, 0, 1, 0, 0,	// 147万
// 0, 1, 0, 0, 1, 0, 0, 1, 0,	// 258条
// 0, 0, 1, 0, 0, 1, 0, 0, 1,	// 369饼
//
// 1, 0, 0, 1, 0, 0, 1, 0, 0,	// 147万
// 0, 0, 1, 0, 0, 1, 0, 0, 1,	// 369条
// 0, 1, 0, 0, 1, 0, 0, 1, 0,	// 258饼
//
// 0, 1, 0, 0, 1, 0, 0, 1, 0,	// 258万
// 1, 0, 0, 1, 0, 0, 1, 0, 0,	// 147条
// 0, 0, 1, 0, 0, 1, 0, 0, 1,	// 369饼
//
// 0, 1, 0, 0, 1, 0, 0, 1, 0,	// 258万
// 0, 0, 1, 0, 0, 1, 0, 0, 1,	// 369条
// 1, 0, 0, 1, 0, 0, 1, 0, 0,	// 147饼
//
// 0, 0, 1, 0, 0, 1, 0, 0, 1,	// 369万
// 1, 0, 0, 1, 0, 0, 1, 0, 0,	// 147条
// 0, 1, 0, 0, 1, 0, 0, 1, 0,	// 258饼
//
// 0, 0, 1, 0, 0, 1, 0, 0, 1,	// 369万
// 0, 1, 0, 0, 1, 0, 0, 1, 0,	// 258条
// 1, 0, 0, 1, 0, 0, 1, 0, 0,	// 147饼
// **************************************************************************************
CJudge.prototype.CheckZuHeLong = function (asStone, cnNormalStone, cnHun, sHuResult, checklist) {
  if (cnNormalStone + cnHun < 9) {
    return Define.F_NOTTING;
  }
  // 组合龙可有6种组合方案,每个元素代表一种方案，每个var的bit位代表需要相应的牌是否需要
  let anSchemeNeedStone = [0x4912449, 0x24a4849, 0x4909292, 0x1264892, 0x2489324, 0x1252524];

  let asLeftStone = [];	//最多还剩5张

  let sHuResultTmp = _.cloneDeep(sHuResult);
  sHuResultTmp.nResultant = Define.ZUHELONG;
  sHuResultTmp.cnGroups = this.m_cnMaxGroups;
  let eRet = Define.F_NOTTING;
  for (let i = 0; i < 6; i++) {
    // 6种方案，都要试一下
    let nGroupIndex = this.m_pCheckParam.cnShowGroups;	// 当前处理的分组标号
    let nStoneIndexOfGroup = 0;	// 当前处理分组里的第几张牌
    let cnLeftStone = 0;		// 剩下的普通牌数
    let cnLeftHun = cnHun;		// 剩下的混牌数
    let nUngroupedIndex = 0;	// 未被分组的牌
    for (let l = 0; l < 13; l++) {
      asLeftStone[l] = new stoneObj();
    }

    let j = 0;
    for (j = 0; j < 27; j++) {
      if (((anSchemeNeedStone[i] >> j) & 0x01) == 0) {
        continue;
      }
      if (this.m_sOriginalStoneRelation.acnHandStones[j] > 0) {
        // 手上有这张牌,遍历一下，将这张牌分组，并将这张牌之前的牌拷到剩余牌数组
        let nLastIndex = nUngroupedIndex;
        let k = 0;
        for (k = nUngroupedIndex; k < cnNormalStone; k++) {
          if (this.GetValue(asStone[k]) == j) {
            //CZD:因为nID不起作用，所以不跳过牌了，可能会出现番种减少的问题
            //if ( this.m_sOriginalStoneRelation.acnHandStones[j] > 1
            //	&& asStone[k].nID == this.m_pCheckParam.asHandStone[0].nID )
            //{
            //	// 如果这张牌有多张，并且当前这一张是和的那张，不将这张放到龙
            //	// 组里，选择其余的相同的牌，因为和的那张牌可能会和其它牌组合
            //	// 算出别的番种，如单钓
            //	continue;
            //}

            // 是这张牌，拷到分组里
            nUngroupedIndex = k + 1;
            sHuResultTmp.asGroup[nGroupIndex].asStone[nStoneIndexOfGroup] = _.cloneDeep(asStone[k]);
            nStoneIndexOfGroup++;
            if (nStoneIndexOfGroup == 3) {
              sHuResultTmp.asGroup[nGroupIndex].nGroupStyle = Define.GROUP_STYLE_LONG;
              // 下一个分组
              nGroupIndex++;
              nStoneIndexOfGroup = 0;
            }

            break;
          }
        }
        for (let j1 = cnLeftStone, k1 = nLastIndex, l1 = 0; l1 < nUngroupedIndex - nLastIndex - 1; l1++) {
          asLeftStone[j1++] = _.cloneDeep(asStone[k1++]);
        }
        cnLeftStone += nUngroupedIndex - nLastIndex - 1;
        if (cnLeftStone > 5) {
          break;
        }
      }
      else {
        // 没这张牌，用混代
        if (cnLeftHun == 0) {
          break;
        }
        // 从最后面取一张混，并将混设成需要的牌
        cnLeftHun--;
        sHuResultTmp.asGroup[nGroupIndex].asStone[nStoneIndexOfGroup] = _.cloneDeep(asStone[cnNormalStone + cnLeftHun]);
        sHuResultTmp.asGroup[nGroupIndex].asStone[nStoneIndexOfGroup].nColor =
          nGroupIndex - this.m_pCheckParam.cnShowGroups;// 按万条饼的顺序
        sHuResultTmp.asGroup[nGroupIndex].asStone[nStoneIndexOfGroup].nWhat = j % 9;
        nStoneIndexOfGroup++;
        if (nStoneIndexOfGroup == 3) {
          sHuResultTmp.asGroup[nGroupIndex].nGroupStyle = Define.GROUP_STYLE_LONG;
          // 下一个分组
          nGroupIndex++;
          nStoneIndexOfGroup = 0;
        }
      }
    }
    if (j != 27) {
      // 中间跳出，说明缺某张牌，试试下一种方案
      continue;
    }

    // 龙组所需要的牌都齐了
    // 这里还要检查一下，是否所有未分组的牌都拷到剩余牌数组里了
    if (nUngroupedIndex < cnNormalStone) {
      // 所有未分组的牌全拷进去
      for (let j = cnLeftStone, k = nUngroupedIndex, l = 0; l <= cnNormalStone - nUngroupedIndex; l++) {
        asLeftStone[j++] = _.cloneDeep(asStone[k++]);
      }

      cnLeftStone += cnNormalStone - nUngroupedIndex;
    }

    if (cnLeftHun != 0) {
      // 还有多余的混，拷到剩余牌数组
      for (let j = cnLeftStone, k = cnNormalStone, l = 0; l < cnLeftHun; l++) {
        asLeftStone[j++] = _.cloneDeep(asStone[k++]);
      }
    }
    checklist.push(Define.FAN_ZHUHELONG);
    checklist.push(Define.FAN_4GUI1);
    if (this.CheckNormal(asLeftStone, cnLeftStone, cnLeftHun, nGroupIndex, sHuResultTmp) == Define.F_NOENOUGHFANS) {
      if (eRet == Define.F_NOTTING) {
        // 标识一下，可以和但番不够
        eRet = Define.F_NOENOUGHFANS;
      }
      continue;
    }
    // 比较一下，是否比以前算出的番数大
    if (sHuResultTmp.nMaxFans > sHuResult.nMaxFans) {
      // 比以前算出的番数大，替换之
      //sHuResult = _.cloneDeep(sHuResultTmp);
      _cpytoobj(sHuResult, sHuResultTmp);
      // 至少有一次成功!
      eRet = Define.T_OK;
    }
  }

  sHuResult.cnGroups = this.m_cnMaxGroups;
  return eRet;
}

// **************************************************************************************
//
// 检验七对和法
//
// **************************************************************************************
CJudge.prototype.CheckSevenPairs = function (asStone, cnNormalStone, cnHun, sHuResult, checklist) {
  // 首先看看是否能和
  if (cnNormalStone + cnHun != 14) {
    return Define.F_NOTTING;
  }
  let cnPairs = 0;
  for (let i = 0; i < 34; i++) {
    if (this.m_sOriginalStoneRelation.acnHandStones[i] < 2) {
      continue;
    }

    if (this.m_sOriginalStoneRelation.acnHandStones[i] == 4) {
      cnPairs += 2;
    }
    else {
      cnPairs++;
    }
  }
  //和七对要求对子数加上混牌数 >= 7
  if (cnPairs + cnHun < 7) {
    return Define.F_NOTTING;
  }

  // 再将混牌变成需要的牌
  Define._memcpy(sHuResult.asHandStone, 0, asStone, 0, 14);
  let nHunIndex = cnNormalStone;
  this.m_sStonesRelation = this.m_sOriginalStoneRelation;
  if (cnHun != 0) {
    for (let i = 0; i < 34; i++) {
      if (this.m_sOriginalStoneRelation.acnHandStones[i] % 2 != 0) {
        this.UseHun(sHuResult.asHandStone[nHunIndex], i, true);
        nHunIndex++;
      }
      if (nHunIndex == cnNormalStone + cnHun) {
        // 没混了
        break;
      }
    }
  }
  //	sHuResult.nResultant = QIDUI;
  //	Sort( sHuResult.asHandStone, 14 );
  //	return EnumerateFans( sHuResult );

  // 需要在这里变混，而不是在算番的函数里变混
  let sHuResultTmp = _.cloneDeep(sHuResult);
  sHuResultTmp.nResultant = Define.QIDUI;
  let eRet = Define.F_NOENOUGHFANS;
  let j = 0;
  let i = 0;
  do {
    // 在下面会修改this.m_sStonesRelation,保存一下
    let sStonesRelation1 = _.cloneDeep(this.m_sStonesRelation);
    if (nHunIndex != cnNormalStone + cnHun) {
      // 第一对混
      this.UseHun(sHuResultTmp.asHandStone[nHunIndex], i, true);
      this.UseHun(sHuResultTmp.asHandStone[nHunIndex + 1], i, true);
      i++;
    }
    else {
      // 只循环一次
      i = 34;
    }
    j = 0;
    do {
      // 在下面会修改this.m_sStonesRelation,保存一下
      let sStonesRelation2 = _.cloneDeep(this.m_sStonesRelation);
      if (nHunIndex == 10) {
        // 还有一对混
        this.UseHun(sHuResultTmp.asHandStone[12], j, true);
        this.UseHun(sHuResultTmp.asHandStone[13], j, true);
        j++;
      }
      else {
        // 只循环一次
        j = 34;
      }
      this.Sort(sHuResult.asHandStone, sHuResult.asHandStone.length);
      if (this.EnumerateFans(sHuResultTmp) == Define.T_OK) {
        eRet = Define.T_OK;
      }
      if (sHuResultTmp.nMaxFans > sHuResult.nMaxFans) {
        //sHuResult = _.cloneDeep(sHuResultTmp);
        _cpytoobj(sHuResult, sHuResultTmp);
      }
      // 在下一次循环前恢复
      this.m_sStonesRelation = sStonesRelation2;
    } while (j < 34);
    // 在下一次循环前恢复
    this.m_sStonesRelation = sStonesRelation1;
  } while (i < 34);

  sHuResult.cnGroups = 14;
  if (eRet == Define.T_OK) {
    if (this.CheckLiansevenDui(this.m_sStonesRelation)) {
      checklist.push(Define.FAN_LIAN7DUI);
    }
    checklist.push(Define.FAN_7DUI);
  }
  return eRet;
}

// **************************************************************************************
//
// 检验十三幺和法
//
// **************************************************************************************
CJudge.prototype.CheckThirteenUnios = function (asStone, cnNormalStone, cnHun, sHuResult, checklist) {
  let acnMax = [2, 0, 0, 0, 0, 0, 0, 0, 2,// 万
    2, 0, 0, 0, 0, 0, 0, 0, 2,// 条
    2, 0, 0, 0, 0, 0, 0, 0, 2,// 饼
    2, 2, 2, 2, 2, 2, 2];
  let nHunIndex = cnNormalStone;
  let tempasStone = _.cloneDeep(asStone);
  for (let i = 0; i < 34; i++) {
    if (this.m_sOriginalStoneRelation.acnHandStones[i] > acnMax[i]) {
      return Define.F_NOTTING;
    }

    if (acnMax[i] != 0 && this.m_sOriginalStoneRelation.acnHandStones[i] == 0) {
      // 缺一张，用混补
      if (nHunIndex == 14) {
        // 没混了
        return Define.F_NOTTING;
      }
      this.UseHun(tempasStone[nHunIndex], i);
      nHunIndex++;
    }
  }
  if (nHunIndex != 14) {
    // 混还没用完，变成一万
    this.UseHun(tempasStone[nHunIndex], 0);
  }

  /*
   for( let i = 0; i < cnNormalStone; i++ )
   {
   if ( asStone[i].nColor < COLOR_WIND )
   {
   // 序数牌，必须1或9
   if ( asStone[i].nWhat != STONE_NO1 && asStone[i].nWhat != STONE_NO9 )
   {
   break;
   }
   }
   }
   if ( i != cnNormalStone )
   {
   return Define.F_NOTTING;
   }

   */
  sHuResult.nResultant = Define.SHISHANYAO;
  sHuResult.cnGroups = 14;
  Define._memcpy(sHuResult.asHandStone, 0, asStone, 0, 14);
  checklist.push(Define.FAN_131);
  return this.EnumerateFans(sHuResult);
}

// **************************************************************************************
//
// 检验全不靠和法
//
// **************************************************************************************
CJudge.prototype.CheckAllLonely = function (asStone, cnNormalStone, cnHun, sHuResult, checklist) {
  // 全不靠
  if (this.m_sOriginalStoneRelation.acnHandColors[Define.COLOR_WAN] > 3
    || this.m_sOriginalStoneRelation.acnHandColors[Define.COLOR_TIAO] > 3
    || this.m_sOriginalStoneRelation.acnHandColors[Define.COLOR_BING] > 3) {
    // 全不靠要求每张牌都不相同，序数牌每门不能超过3张
    return Define.F_NOTTING;
  }

  let abHadStone = [false, false, false];
  let anFirstWhat = [-1, -1, -1];	// 每个龙组的第一张牌数字
  for (let i = 0; i < 3; i++) {
    let nColorFirstIndx = (i << 3) + i;//i * 9;
    for (let j = 0; j < 9; j++) {
      if (this.m_sOriginalStoneRelation.acnHandStones[nColorFirstIndx + j] == 0) {
        continue;
      }
      if (anFirstWhat[i] == -1) {
        // 记下本花色(也即本龙组)第一张牌应该是什么数字
        anFirstWhat[i] = j % 3;

        if (abHadStone[anFirstWhat[i]]) {
          // 其它花色已有这个系列的牌了
          return Define.F_NOTTING;
        }
        abHadStone[anFirstWhat[i]] = true;
      }

      if (j != anFirstWhat[i] && (j - anFirstWhat[i]) % 3 != 0) {
        // 数字差必须是3的倍数
        return Define.F_NOTTING;
      }
    }
  }
  let cnWind = 0;
  for (let i = 27; i < 34; i++) {
    if (this.m_sOriginalStoneRelation.acnHandStones[i] > 1) {
      return Define.F_NOTTING;
    }
    cnWind += this.m_sOriginalStoneRelation.acnHandStones[i];
  }
  Define._memcpy(sHuResult.asHandStone, 0, asStone, 0, 14);
  this.m_sStonesRelation = this.m_sOriginalStoneRelation;// 分组后将出现变化
  if (cnHun > 0) {
    let nHunIndex = cnNormalStone;
    if (cnWind + cnHun >= 7) {
      // 设置混，成为七星不靠和牌牌型
      for (let i = 27; i < 34; i++) {
        if (0 == this.m_sOriginalStoneRelation.acnHandStones[i]) {
          this.UseHun(sHuResult.asHandStone[nHunIndex], i);
          nHunIndex++;
        }
      }
    }

    // 剩下的混牌以序数牌，字牌的顺序一一设定
    this.UseHunForLong(sHuResult.asHandStone + nHunIndex, cnNormalStone + cnHun - nHunIndex, anFirstWhat);
  }

  sHuResult.nResultant = Define.QUANBUKAO;
  sHuResult.cnGroups = 14;
  checklist.push(Define.FAN_7XINBUKAO);
  checklist.push(Define.FAN_QUANBUKAO);
  return this.EnumerateFans(sHuResult);
}


// **************************************************************************************
//
// 是不是13幺
//
// **************************************************************************************
CJudge.prototype.IsThirteenUnios = function (asTile) {
  // 1.相同的牌最多只能有两张
  // 2.只能有19风箭牌
  let bMoreTile = false;
  let acnTile = [];
  for (let i = 0; i < 5; i++) {
    acnTile[i] = [];
    for (let j = 0; j < 9; j++) {
      acnTile[i][j] = 0;
    }
  }
  for (let i = 0; i < 14; i++) {
    if (this.IsHun(asTile[i])) {
      // 混牌肯定是不用检验的
      continue;
    }

    acnTile[asTile[i].nColor][asTile[i].nWhat]++;
    if (acnTile[asTile[i].nColor][asTile[i].nWhat] > 1) {
      if (bMoreTile) {
        return false;
      }
      bMoreTile = true;
    }
    if (asTile[i].nColor == Define.COLOR_WIND || asTile[i].nColor == Define.COLOR_JIAN) {
      continue;
    }
    if (asTile[i].nWhat != Define.STONE_NO1 && asTile[i].nWhat != Define.STONE_NO9) {
      return false;
    }
  }

  return true;
}

// **************************************************************************************
//
// 是不是全不靠
//
// **************************************************************************************
CJudge.prototype.IsAllLonely = function (asTile) {
  // 先将据有牌按正常的顺序排列
  this.Sort(asTile, asTile.length);

  let nLastColor = 0;			// 上一张牌的花色
  let cnSameColorTile = 0;	// 同一花色的牌的张数
  let nLastWhat = asTile[0].nWhat;// 同一花色的上一张牌的点数
  let abHad = [false, false, false, false, false, false, false, false, false];		// 每个数字只能出现一次
  abHad[nLastWhat] = true;
  for (let i = 1; i < 14; i++) {
    if (this.IsHun(asTile[i])) {
      // 混牌肯定是不用检验的
      continue;
    }

    if (asTile[i].nColor >= Define.COLOR_WIND) {
      // 风牌箭牌，在下面检验
      if (asTile[i].nColor == nLastColor && asTile[i].nWhat == nLastWhat) {
        // 不能重复
        return false;
      }
      continue;
    }

    if (asTile[i].nColor != nLastColor) {
      // 新的花色了
      nLastColor = asTile[i].nColor;
      nLastWhat = asTile[i].nWhat;
      cnSameColorTile = 0;
      if (abHad[nLastWhat]) {
        // 这个数字已出现过了
        return false;
      }
      abHad[nLastWhat] = true;
      continue;
    }

    // 这一张牌跟上一张牌花色相同
    cnSameColorTile++;
    if (cnSameColorTile > 3) {
      // 一个花色最多只能有3张
      return false;
    }
    if ((asTile[i].nWhat - nLastWhat) % 3 != 0) {
      // 牌差得是3的倍数
      return false;
    }
    nLastWhat = asTile[i].nWhat;
    if (abHad[nLastWhat]) {
      // 这个数字已出现过了
      return false;
    }
    abHad[nLastWhat] = true;
  }

  return true;
}

// **************************************************************************************
//
// 检验是否可和普通牌型，算出最大番数
//
// **************************************************************************************
CJudge.prototype.CheckNormal = function (asStone, cnNormalStone, cnHun, cnGrouped, sHuResult) {
  // 选将
  let anJongIndex = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
  let cnPossibleJongs = this.EnumerateJong(asStone, cnNormalStone, cnHun, anJongIndex);
  if (0 == cnPossibleJongs) {
    return Define.F_NOTTING;
  }

  let sJongGroup = new Define.stoneGroup();
  sJongGroup.nGroupStyle = Define.GROUP_STYLE_JONG;
  let asLeftStone = [];	// 除掉将牌后还剩下的牌
  for (let i = 0; i < 15; i++) {
    asLeftStone[i] = new stoneObj();
  }
  let cWinTree = new CQuadrantTree();//11111111111111111111111
  let sHuResultTmp = _.cloneDeep(sHuResult);
  //	sHuResultTmp.nResultant = NORMAL;
  sHuResultTmp.cnGroups = this.m_cnMaxGroups;
  let cnLeftStone;
  let cnLeftHun;
  let sRet = Define.F_NOTTING;
  for (let i = 0; i < cnPossibleJongs; i++) {
    sJongGroup.asStone[0] = _.cloneDeep(asStone[anJongIndex[i][0]]);
    sJongGroup.asStone[1] = _.cloneDeep(asStone[anJongIndex[i][1]]);
    Define._memcpy(asLeftStone, 0, asStone, 0, anJongIndex[i][0]);//第一张之前的
    if (this.IsHun(asStone[anJongIndex[i][1]])) {
      // 第二张是混牌
      if (this.IsHun(asStone[anJongIndex[i][0]])) {
        // 第一张也是混牌
        cnLeftStone = cnNormalStone;
        cnLeftHun = cnHun - 2;
      }
      else {
        // 将混牌变成和第一张一样的花色点数
        sJongGroup.asStone[1].nColor = sJongGroup.asStone[0].nColor;
        sJongGroup.asStone[1].nWhat = sJongGroup.asStone[0].nWhat;
        cnLeftStone = cnNormalStone - 1;
        cnLeftHun = cnHun - 1;
        // 两张之间的牌拷入剩余牌数组

        Define._memcpy(asLeftStone, anJongIndex[i][0], asStone, anJongIndex[i][0] + 1, (anJongIndex[i][1] - anJongIndex[i][0] - 1));
      }
    }
    else {
      // 两张都不是混
      cnLeftStone = cnNormalStone - 2;
      cnLeftHun = cnHun;
      // 第二张之后的的牌拷入剩余牌数组
      Define._memcpy(asLeftStone, anJongIndex[i][1] - 1, asStone, anJongIndex[i][1] + 1, (cnNormalStone + cnHun - anJongIndex[i][1] - 1));
    }
    if (cWinTree.Create(sJongGroup, asLeftStone, cnLeftStone, cnLeftHun)) {
      // 创建成功,说明至少有一种和法
      let cnWinPath = cWinTree.GetPathCount();//11111111111111111
      for (let j = 0; j < cnWinPath; j++) {
        // 遍历所有和法，算出所有番种
        //let vrTemp = [];
        //for (let i = cnGrouped,len = sHuResultTmp.asGroup.length; i < len; ++i){
        //    vrTemp.push(sHuResultTmp.asGroup[i]);
        //}
        //sHuResultTmp.asGroup = vrTemp;

        cWinTree.GetPath(j, sHuResultTmp.asGroup, cnGrouped);//111111111111111111
        this.m_sStonesRelation = new Define.stoneRelation();
        //				if ( EnumerateFans( sHuResultTmp ) == Define.F_NOENOUGHFANS )



        let eRetTmp = this.EnumerateHunFans(cnGrouped, sHuResultTmp);
        // 比较一下，是否比以前算出的番数大
        if (sHuResultTmp.nMaxFans > sHuResult.nMaxFans) {
          // sHuResult = _.cloneDeep(sHuResultTmp);
          _cpytoobj(sHuResult, sHuResultTmp);
        }
        if (eRetTmp == Define.T_OK) {
          // 至少有一种和法
          sRet = Define.T_OK;
        }
        else if (eRetTmp == Define.F_NOENOUGHFANS && sRet == Define.F_NOTTING) {
          // 至少有一种和法，只是番不够
          sRet = Define.F_NOENOUGHFANS;
        }
      }
    }
  }

  sHuResult.cnGroups = this.m_cnMaxGroups;
  return sRet;
}

// **************************************************************************************
//
// 取得牌型信息
//
// **************************************************************************************
CJudge.prototype.GetStonesRelation = function (asHandStone, cnHandStone, sStonesRelation) {
  sStonesRelation.bNoEat = true;
  let nColor, nWhat;
  //	BOOL abAppearedColor[5] = { 0 };		// 已出现过的花色
  for (let i = 0; i < cnHandStone; i++) {
    // 手中牌
    if (this.IsHun(asHandStone[i])) {
      sStonesRelation.cnHun++;
      continue;
    }
    nColor = asHandStone[i].nColor;
    nWhat = asHandStone[i].nWhat;

    sStonesRelation.acnHandStones[this.GetValuebynColorandnWhat(nColor, nWhat)]++;
    if (sStonesRelation.acnHandColors[nColor] == 0) {
      sStonesRelation.cnHandColors++;
    }
    sStonesRelation.acnHandColors[nColor]++;
  }

  for (let j = 0; j < sStonesRelation.acnHandStones.length; j++) {
    if (sStonesRelation.acnHandStones[j] > 0) {
      sStonesRelation.cnStoneTypes++;
    }
  }

  // 计算一下所有牌的花色个数和每种牌个数
  sStonesRelation.cnAllColors = sStonesRelation.cnHandColors;
  sStonesRelation.acnAllColors = _.cloneDeep(sStonesRelation.acnHandColors);
  sStonesRelation.acnAllStones = _.cloneDeep(sStonesRelation.acnHandStones);
  if (cnHandStone < this.m_cnMaxHandStone) {
    // 吃碰杠的牌
    for (let i = 0; i < this.m_pCheckParam.cnShowGroups; i++) {
      nColor = this.m_pCheckParam.asShowGroup[i].asStone[0].nColor;
      nWhat = this.m_pCheckParam.asShowGroup[i].asStone[0].nWhat;
      let nIndex = this.GetValuebynColorandnWhat(nColor, nWhat);
      if (sStonesRelation.acnAllColors[nColor] == 0) {
        // 这种花色前面未出现过，花色数加1
        sStonesRelation.cnAllColors++;
      }
      sStonesRelation.acnAllColors[nColor] += 3;
      if (this.m_pCheckParam.asShowGroup[i].nGroupStyle == Define.GROUP_STYLE_SHUN) {
        // 肯定是吃的牌
        sStonesRelation.bNoEat = false;
        sStonesRelation.acnAllStones[nIndex]++;
        sStonesRelation.acnAllStones[nIndex + 1]++;
        sStonesRelation.acnAllStones[nIndex + 2]++;
      }
      else if (this.m_pCheckParam.asShowGroup[i].nGroupStyle == Define.GROUP_STYLE_KE) {
        // 刻
        sStonesRelation.acnAllStones[nIndex] += 3;
      }
      else {
        // 杠
        sStonesRelation.acnAllStones[nIndex] += 4;
      }
    }
  }
}

// **************************************************************************************
//
// 看看哪些牌可做将
//
// **************************************************************************************
CJudge.prototype.EnumerateJong = function (asStone, cnNormalStone, cnHun, anJongIndex) {
  // 手中牌张数信息，如果第i张牌有n张，那么acnStone[i]为n，i之后的n-1个数组元素为0
  let acnStone = [];
  for (let k = 0; k < Define.MAX_HAND_COUNT; k++) {
    acnStone[k] = 0;
  }
  let i = 0;
  while (i < cnNormalStone) {
    acnStone[i] = 1;
    for (let j = i + 1; j < cnNormalStone; j++) {
      if (this.IsSameStone(asStone[j], asStone[i])) {
        acnStone[i]++;
      }
      else {
        break;
      }
    }
    i += acnStone[i];
  }

  let cnJong = 0;
  for (i = 0; i < cnNormalStone; i++) {
    if (0 == acnStone[i]) {
      continue;
    }

    if (1 == acnStone[i]) {
      // 这张牌只有一张,只能拿混补
      if (cnHun == 0) {
        // 没有混，不能做将
        continue;
      }
      anJongIndex[cnJong][0] = i;
      anJongIndex[cnJong][1] = cnNormalStone + cnHun - 1;
    }
    else {
      // 多于一张
      anJongIndex[cnJong][0] = i;
      anJongIndex[cnJong][1] = i + 1;
    }
    cnJong++;
  }

  if (cnHun > 1) {
    // 有1张以上的混，可以用两张混做将
    anJongIndex[cnJong][0] = cnNormalStone + cnHun - 2;
    anJongIndex[cnJong][1] = cnNormalStone + cnHun - 1;
    cnJong++;
  }

  return cnJong;
}

// **************************************************************************************
//
// 指定若干张混为“龙”组中缺的几张牌
//
// **************************************************************************************
CJudge.prototype.UseHunForLong = function (asHun, cnHun, anFirstWhat) {
  if (cnHun <= 0) {
    return;
  }

  let cnHunUsed = 0;
  for (let i = 0; i < 3; i++) {
    // 三个花色
    let nColorFirstIndex = (i << 8) + i;
    if (anFirstWhat[i] == -1) {
      let j = 0;
      // 这个花色没牌,确定该补哪个系列的牌
      for (j = 0; j < 3; j++) {
        // 看看哪个数字没被用过
        if (anFirstWhat[0] != j && anFirstWhat[1] != j && anFirstWhat[2] != j) {
          anFirstWhat[i] = j;
          break;
        }
      }
    }

    for (let k = anFirstWhat[i]; k < 9; k += 3) {
      let nStoneValue = this.GetValuebynColorandnWhat(i, k);
      if (this.m_sStonesRelation.acnHandStones[nStoneValue] != 0) {
        continue;
      }
      this.UseHun(asHun[cnHunUsed], nStoneValue);
      cnHunUsed++;
      if (cnHunUsed == cnHun) {
        return;
      }
    }
  }

  // 还有多余的混，加到字牌里
  for (let i = 27; i < 34; i++) {
    if (this.m_sStonesRelation.acnHandStones[i] != 0) {
      continue;
    }
    this.UseHun(asHun[cnHunUsed], i);
    cnHunUsed++;
    if (cnHunUsed == cnHun) {
      return;
    }
  }

  // 在上面就应该返回了

  /*
   let cnHunUsed = 0;
   let nPennilessColor = -1;	// 一张牌也没有的花色
   //	let anFirstWhat[3] = { -1, -1, -1 };	// 每个龙组的第一张牌数字
   for( let i = 0; i < 3; i++ )
   {
   // 三个花色
   let nFirstIndex = ( i << 8 ) + i;
   for( let j = 0; j < 9; j++ )
   {
   // 找到本花色的第一张牌
   if ( acnStone[nFirstIndex + j] != 0 )
   {
   break;
   }
   }
   if ( j == 9 )
   {
   // 本花色一张牌也没有，全要用混补
   nPennilessColor = i;
   continue;
   }

   anFirstWhat[i] = j % 3;
   for( let k = anFirstWhat[i]; k < 9; k += 3 )
   {
   if ( k == j || acnStone[k] != 0 )
   {
   continue;
   }
   asHun[cnHunUsed].nColor = i;
   asHun[cnHunUsed].nWhat = k;
   cnHunUsed++;
   }
   }

   // 对一张也没的花色加混
   if ( nPennilessColor != -1 )
   {
   // 每个花色的第一张只能是1、2、3
   for( i = 0; i < 3; i++ )
   {
   // 看看哪个数字没被用过
   if ( anFirstWhat[0] != i && anFirstWhat[1] != i && anFirstWhat[2] != i )
   {
   break;
   }
   }
   ASSERT( i < 3 );

   for( let j = 0; j < 3; j++ )
   {
   asHun[cnHunUsed].nColor = nPennilessColor;
   asHun[cnHunUsed].nWhat = i + ( j << 1 ) + j;//j * 3;
   }
   }
   */

}

// **************************************************************************************
//
// 给定一个ID号，在分组信息里搜索这张牌，得到它的花色点数,并返回所在分组索引号
//
// **************************************************************************************
CJudge.prototype.GetTileInfo = function (nTileID, asGroup, sTileInfo) {
  for (let i = 0; i < this.m_cnMaxGroups; i++) {
    let cnGroupStones = 3;
    if (asGroup[i].nGroupStyle == Define.GROUP_STYLE_JONG) {
      cnGroupStones = 2;
    }
    for (let j = 0; j < cnGroupStones; j++) {
      if (nTileID == asGroup[i].asStone[j].nID) {
        sTileInfo.nColor = asGroup[i].asStone[j].nColor;
        sTileInfo.nWhat = asGroup[i].asStone[j].nWhat;
        sTileInfo.nGroupIndex = i;
        sTileInfo.nIndex = j;
        return true;
      }
    }
  }

  // 必须成功
  return false;
}


// **************************************************************************************
//
// 取得分组信息
// 填写GROUPSRELATION结构，同时根据分好组的牌填写STONESRELATION结构的部份信息
// STONESRELATION结构在算番时有用的成员：cnAllColors, acnAllColors, acnAllStones, bNoEat
// cnStoneTypes
//
// **************************************************************************************
CJudge.prototype.GetGroupsInfo1 = function (asStoneGroup, sGroupsRelation, sStonesRelation) {
  let nColor, nWhat;
  sStonesRelation.bNoEat = this.m_sOriginalStoneRelation.bNoEat;

  for (let i = 0; i < this.m_cnMaxGroups; i++) {
    nColor = asStoneGroup[i].asStone[0].nColor;
    nWhat = asStoneGroup[i].asStone[0].nWhat;
    if (sStonesRelation.acnAllColors[nColor] == 0) {
      // 前面的牌里没出现过这种花色
      sStonesRelation.cnAllColors++;
    }
    switch (asStoneGroup[i].nGroupStyle) {
      case Define.GROUP_STYLE_SHUN:
        // 顺
        sGroupsRelation.cnShunGroups++;
        sGroupsRelation.acnShunGroups[nColor][nWhat]++;
        sStonesRelation.acnAllColors[nColor] += 3;
        sStonesRelation.acnAllStones[this.GetValuebynColorandnWhat(nColor, nWhat)]++;
        sStonesRelation.acnAllStones[this.GetValuebynColorandnWhat(nColor, nWhat + 1)]++;
        sStonesRelation.acnAllStones[this.GetValuebynColorandnWhat(nColor, nWhat + 2)]++;
        break;
      case Define.GROUP_STYLE_KE:
        sGroupsRelation.cnKeGroups++;
        sGroupsRelation.acnKeGroups[nColor][nWhat]++;
        sStonesRelation.acnAllColors[nColor] += 3;
        sStonesRelation.acnAllStones[this.GetValuebynColorandnWhat(nColor, nWhat)] += 3;
        break;
      case Define.GROUP_STYLE_JONG:
        sStonesRelation.acnAllColors[nColor] += 2;
        sStonesRelation.acnAllStones[this.GetValuebynColorandnWhat(nColor, nWhat)] += 2;
        break;
      case Define.GROUP_STYLE_MINGGANG:
      case Define.GROUP_STYLE_ANGANG:
        sGroupsRelation.cnKeGroups++;
        sGroupsRelation.acnKeGroups[nColor][nWhat]++;
        sStonesRelation.acnAllColors[nColor] += 4;
        sStonesRelation.acnAllStones[this.GetValuebynColorandnWhat(nColor, nWhat)] += 4;
        break;
      case Define.GROUP_STYLE_LONG:
        sStonesRelation.acnAllColors[nColor] += 3;
        sStonesRelation.acnAllStones[this.GetValuebynColorandnWhat(nColor, nWhat)]++;
        sStonesRelation.acnAllStones[this.GetValuebynColorandnWhat(nColor, nWhat + 3)]++;
        sStonesRelation.acnAllStones[this.GetValuebynColorandnWhat(nColor, nWhat + 6)]++;
        break;
      //		case GROUP_STYLE_HUN:
      //			// 全是混的分组
      //			sGroupsRelation.cnHunGroups++;
      //			sStonesRelation.cnHun += 3;
      //			break;
      default:
        //ASSERT( false );
        break;
    }
  }
}

// **************************************************************************************
//
// 取得分组信息
// 填写GROUPSRELATION结构，同时根据分好组的牌填写STONESRELATION结构的部份信息
// STONESRELATION结构在算番时有用的成员：cnAllColors, acnAllColors, acnAllStones
//
// **************************************************************************************
CJudge.prototype.GetGroupsInfo = function (sHuResult, sGroupsRelation, sStonesRelation) {
  if (sHuResult.nResultant == Define.NORMAL || sHuResult.nResultant == Define.PENPENHU
    || sHuResult.nResultant == Define.ZUHELONG) {
    // 有分组
    this.GetGroupsInfo1(sHuResult.asGroup, sGroupsRelation, sStonesRelation);
  }
  else {
    // 无分组,只要填写STONESRELATION结构就行了
    //GetStonesRelation( sHuResult.asHandStone, this.m_cnMaxHandStone, sStonesRelation );
    sStonesRelation = new Define.stoneRelation();
    for (let i = 0; i < 14; i++) {
      let nColor = sHuResult.asHandStone[i].nColor;
      let nWhat = sHuResult.asHandStone[i].nWhat;
      if (sStonesRelation.acnAllColors[nColor] == 0) {
        sStonesRelation.cnAllColors++;
      }
      sStonesRelation.acnAllColors[nColor]++;
      sStonesRelation.acnAllStones[this.GetValue(sHuResult.asHandStone[i])]++;
    }
  }
}

// **************************************************************************************
//
// 是否花牌
//
// **************************************************************************************
CJudge.prototype.IsFlower = function (nStoneID) {
  if ((nStoneID & 0x0F00) == Define.COLOR_FLOWER) {
    return true;
  }

  return false;
}

// **************************************************************************************
//
// 检验传入的参数合法性
//
// **************************************************************************************
CJudge.prototype.InvalidParam = function (sCheckParam) {
  if (sCheckParam.cnHandStone % 3 != 2) {
    // 所有未公开的牌减去将牌牌数应能被3整除否则必然不能和
    return true;
  }

  for (let i = 0; i < sCheckParam.cnHandStone; i++) {
    if (this.IsFlower(sCheckParam.asHandStone[i].nID)) {
      return true;
    }
  }

  return false;
}

// **************************************************************************************
//
// 是否相同的牌
//
// **************************************************************************************
CJudge.prototype.IsSameStone = function (sStone1, sStone2) {
  return sStone1.nColor == sStone2.nColor && sStone1.nWhat == sStone2.nWhat;
}

// **************************************************************************************
//
// 从一字符串里读取第一个数字，返回值指向下一数字
//
// **************************************************************************************
CJudge.prototype.GetPrivateInt = function (pChar, nData) {
  let i = 0;
  let data = "";
  while (pChar[i] == " ") {
    i++;
  }
  if (pChar[i]) {
    //nData = parseInt( pChar[i] );
  }
  while (pChar[i] != " " && pChar[i]) {
    data += pChar[i];
    i++;
  }
  nData = parseInt(data);
  return pChar.splice(0, i);
}

// **************************************************************************************
//
// 从花色点数得到一维数组的索引号
//
// **************************************************************************************
CJudge.prototype.GetValuebynColorandnWhat = function (nColor, nWhat) {
  //2007-01-17 查明修改　换牌可以换花
  if (nColor < 4) {
    return nColor + (nColor << 3) + nWhat;//nColor * 9 + nWhat;
  }
  else if (nColor == Define.COLOR_JIAN) { // 中发白
    return 31 + nWhat;
  }
  else if (nColor == Define.COLOR_FLOWER) {
    return 34 + nWhat;
  }
  else if (nColor == Define.COLOR_SEASON) {
    return 38 + nWhat;
  }
  else {

  }

  return 0;
}

// **************************************************************************************
//
// 得到一张牌的一维数组索引号
//
// **************************************************************************************
CJudge.prototype.GetValue = function (sStone) {
  return this.GetValuebynColorandnWhat(sStone.nColor, sStone.nWhat);
}

// **************************************************************************************
//
// 获得算番入口
//
// **************************************************************************************
CJudge.prototype.GetEntry = function (sHuResult) {
  let nRow = 0;
  let nCol = 0;
  if (sHuResult.nResultant > Define.PENPENHU) {
    // 根据和牌方式决定行下标
    nRow = sHuResult.nResultant;
    if (sHuResult.nResultant == Define.SHISHANYAO) {
      nCol = 5;
      return { nRow: nRow, nCol: nCol };
    }
  }
  else {
    // 根据刻的数量决定行下标
    nRow = this.m_sGroupsRelation.cnKeGroups;
  }
  if (this.m_sStonesRelation.cnAllColors == 1) {
    if (this.m_sStonesRelation.acnAllColors[Define.COLOR_WIND] != 0) {
      // 全是风牌,字一色
      nCol = 1;
    }
    else {
      // 清一色
      nCol = 0;
    }
  }
  else if (this.m_sStonesRelation.cnAllColors == 2) {
    if (this.m_sStonesRelation.acnAllColors[Define.COLOR_WIND] != 0
      && this.m_sStonesRelation.acnAllColors[Define.COLOR_JIAN] != 0) {
      // 字一色
      nCol = 1;
    }
    else if (this.m_sStonesRelation.acnAllColors[Define.COLOR_WIND] != 0
      || this.m_sStonesRelation.acnAllColors[Define.COLOR_JIAN] != 0) {
      // 混一色
      nCol = 2;
    }
    else {
      // 无字
      nCol = 4;
    }
  }
  else if (this.m_sStonesRelation.cnAllColors == 3) {
    if (this.m_sStonesRelation.acnAllColors[Define.COLOR_WIND] != 0
      && this.m_sStonesRelation.acnAllColors[Define.COLOR_JIAN] != 0) {
      // 混一色
      nCol = 2;
    }
    else if (this.m_sStonesRelation.acnAllColors[Define.COLOR_WIND] != 0
      || this.m_sStonesRelation.acnAllColors[Define.COLOR_JIAN] != 0) {
      // 有字
      nCol = 3;
    }
    else {
      // 无字
      nCol = 4;
    }

  }
  else if (this.m_sStonesRelation.cnAllColors == 4) {
    // 有字
    nCol = 3;
  }
  else {
    // 五门齐
    nCol = 5;
  }
  return { nRow: nRow, nCol: nCol };
}
// **************************************************************************************
//
//5 四杠 4个杠,不计双暗杠、双明杠、明杠、暗杠、三杠、单钓、碰碰和
//
// **************************************************************************************
CJudge.prototype.Check4Gang = function (sHuResult, that) {
  if (that.m_pCheckParam.cnAnGang + that.m_pCheckParam.cnMinGang == 4) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_3GANG] = false;
    that.m_abEnableRule[Define.FAN_2MINGANG] = false;
    that.m_abEnableRule[Define.FAN_2ANGANG] = false;
    that.m_abEnableRule[Define.FAN_ANGANG] = false;
    that.m_abEnableRule[Define.FAN_MINGANG] = false;
    that.m_abEnableRule[Define.FAN_DANDIAO] = false;
    that.m_abEnableRule[Define.FAN_PENPENHU] = false;

    return 1;
  }

  return 0;
}

// **************************************************************************************
//
//6 连七对 由一种花色序数牌组成序数相连的7个对子的和牌。不计清一色、不求人、单钓
// 在算此番之前必须已确定是清一色、七对
// 不计七对、清一色、不求人、单钓、无字、门清
//
// **************************************************************************************
CJudge.prototype.CheckLiansevenDui = function (m_sStonesRelation) {
  let i = 0;
  // 找到有牌的花色
  for (i = 0; i < 3; i++) {
    if (m_sStonesRelation.acnAllColors[i] != 0) {
      break;
    }
  }
  if (i >= 3) {
    return 0;
  }

  // 找到第一对
  let nFirstIndex = i + (i << 3);
  for (i = 0; i < Define.STONE_NO4; i++) {
    if (m_sStonesRelation.acnAllStones[nFirstIndex] == 2) {
      break;
    }
    nFirstIndex++;
  }
  if (i == Define.STONE_NO4) {
    return 0;
  }

  // 从第一对开始，必须连续有对
  for (i = 1; i < 7; i++) {
    if (m_sStonesRelation.acnAllStones[nFirstIndex + i] != 2) {
      return 0;
    }
  }

  return 1;
}

CJudge.prototype.CheckLian7Dui = function (sHuResult, that) {
  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_QING1SHE] = false;
  that.m_abEnableRule[Define.FAN_7DUI] = false;
  that.m_abEnableRule[Define.FAN_BUQIUREN] = false;
  that.m_abEnableRule[Define.FAN_DANDIAO] = false;
  that.m_abEnableRule[Define.FAN_MENGQING] = false;

  return 1;
}

// **************************************************************************************
//
//7 十三幺 由3种序数牌的一、九牌，7种字牌及其中一对作将组成的和牌。不计五门齐、不求人、单钓
//	不计门前清
//
// **************************************************************************************
CJudge.prototype.Check131 = function (sHuResult, that) {
  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_5MENQI] = false;
  that.m_abEnableRule[Define.FAN_BUQIUREN] = false;
  that.m_abEnableRule[Define.FAN_DANDIAO] = false;
  that.m_abEnableRule[Define.FAN_MENGQING] = false;

  return 1;
}

//
//64番
// **************************************************************************************
//
//8 清幺九 由序数牌一、九刻子组成的和牌。不计碰碰和、两同刻、无字、全带幺、幺九刻
//  不计混幺九、幺九头
//
// **************************************************************************************
CJudge.prototype.CheckQing19 = function (sHuResult, that) {
  //	for( let i = 0; i < that.m_pCheckParam.cnHandStone; i++ )
  //	{
  //		if ( that.m_pCheckParam.asHandStone[i].nColor >= COLOR_WIND
  //			|| that.m_pCheckParam.asHandStone[i].nWhat != STONE_NO1
  //			&& that.m_pCheckParam.asHandStone[i].nWhat != STONE_NO9 )
  //		{
  //			return 0;
  //		}
  //	}
  for (let i = 0; i < 27; i++) {
    if (i % 9 == 0 || i % 9 == 8) {
      continue;
    }
    if (that.m_sStonesRelation.acnAllStones[i] != 0) {
      return 0;
    }
  }
  for (let i = 27; i < 34; i++) {
    if (that.m_sStonesRelation.acnAllStones[i] != 0) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_PENPENHU] = false;
  that.m_abEnableRule[Define.FAN_2TONGKE] = false;
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  that.m_abEnableRule[Define.FAN_HUN19] = false;
  that.m_abEnableRule[Define.FAN_QUANDAIYAO] = false;
  that.m_abEnableRule[Define.FAN_19KE] = false;
  that.m_abEnableRule[Define.FAN_19JONG] = false;

  return 1;
}

// **************************************************************************************
//
//9 小四喜 和牌时有风牌的3副刻子及将牌。不计三风刻
//
// **************************************************************************************
CJudge.prototype.CheckXiao4Xi = function (sHuResult, that) {
  let cnWindGroup = 0;
  for (let i = 27; i < 31; i++) {
    if (that.m_sStonesRelation.acnAllStones[i] != 0) {
      cnWindGroup++;
    }
  }
  // 最后一组是将牌，将牌必须是风牌并且不能是已成刻的风牌
  if (cnWindGroup == 4 && sHuResult.asGroup[4].asStone[0].nColor == Define.COLOR_WIND) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_3FENGKE] = false;
    return 1;
  }

  return 0;

  /*
   let cnWindGroup = 0;
   for( let i = 0; i < that.m_cnMaxGroups - 1; i++ )
   {
   if ( sHuResult.asGroup[i].asStone[0].nColor == COLOR_WIND )
   {
   cnWindGroup++;
   }
   }
   // 最后一组是将牌，将牌必须是风牌并且不能是已成刻的风牌
   if ( cnWindGroup == 3 && sHuResult.asGroup[i].asStone[0].nColor == COLOR_WIND
   && that.m_sGroupsRelation.acnKeGroups[COLOR_WIND][sHuResult.asGroup[i].asStone[0].nWhat] == 0 )
   {
   // 屏蔽掉不计的番种
   that.m_abEnableRule[FAN_3FENGKE] = false;
   return 1;
   }

   return 0;
   */
}

// **************************************************************************************
//
//10 小三元 和牌时有箭牌的两副刻子及将牌。不计箭刻、双箭刻
//
// **************************************************************************************
CJudge.prototype.CheckXiao3Yuan = function (sHuResult, that) {
  let cnJianKe = 0;
  for (let i = 0; i < 3; i++) {
    if (that.m_sGroupsRelation.acnKeGroups[Define.COLOR_JIAN][i] != 0) {
      cnJianKe++;
    }
  }
  if (cnJianKe == 2) {
    // 将牌要是箭牌并且不能是已成刻的箭牌
    if (sHuResult.asGroup[that.m_cnMaxGroups - 1].asStone[0].nColor == Define.COLOR_JIAN
      && that.m_sGroupsRelation.acnKeGroups[Define.COLOR_JIAN][sHuResult.asGroup[that.m_cnMaxGroups - 1].asStone[0].nWhat] == 0) {
      // 屏蔽掉不计的番种
      that.m_abEnableRule[Define.FAN_JIANKE] = false;
      that.m_abEnableRule[Define.FAN_2JIANKE] = false;
      that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
      return 1;
    }
  }

  return 0;
}

// **************************************************************************************
//
//11 字一色 由字牌的刻子(杠)、将组成的和牌。
// 不计碰碰和 混幺九 全带幺  幺九刻  缺一门
//
// **************************************************************************************
CJudge.prototype.CheckZi1She = function (sHuResult, that) {
  for (let i = 0; i < 27; i++) {
    if (that.m_sOriginalStoneRelation.acnAllStones[i] > 0) {
      return 0;
    }
  }
  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_PENPENHU] = false;
  that.m_abEnableRule[Define.FAN_HUN19] = false;
  that.m_abEnableRule[Define.FAN_QUANDAIYAO] = false;
  that.m_abEnableRule[Define.FAN_19KE] = false;
  that.m_abEnableRule[Define.FAN_QUE1MEN] = false;

  return 1;
}

// **************************************************************************************
//
//12 四暗刻 4个暗刻(暗杠)。不计门前清、碰碰和、三暗刻、双暗刻、不求人
// 如果不是自摸和牌，和的那一刻不能算暗刻
// 不是自摸的不计单钓将
//
// **************************************************************************************
CJudge.prototype.Check4AnKe = function (sHuResult, that) {
  // 手中刻的数量
  let cnAnKe = 0;
  if (that.m_sGroupsRelation.cnKeGroups == 4
    && that.m_pCheckParam.cnAnGang == that.m_pCheckParam.cnShowGroups) {
    // 只有暗杠，没有吃碰明杠
    if ((that.m_pCheckParam.nWinMode & Define.WIN_MODE_ZIMO) == 0) {
      // 如果不是自摸和牌，和的那一刻不能算暗刻,因此，点炮和牌时只有单钓才能算四暗刻
      //			if ( !IsSameStone( that.m_pCheckParam.asHandStone[0],
      //				sHuResult.asGroup[that.m_cnMaxGroups - 1].asStone[0] ) )
      if (that.m_pCheckParam.asHandStone[0].nID != sHuResult.asGroup[4].asStone[0].nID
        && that.m_pCheckParam.asHandStone[0].nID != sHuResult.asGroup[4].asStone[1].nID) {
        return 0;
      }
    }

    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_MENGQING] = false;
    that.m_abEnableRule[Define.FAN_PENPENHU] = false;
    that.m_abEnableRule[Define.FAN_BUQIUREN] = false;
    that.m_abEnableRule[Define.FAN_3ANKE] = false;
    that.m_abEnableRule[Define.FAN_2ANKE] = false;
    if ((that.m_pCheckParam.nWinMode & Define.WIN_MODE_ZIMO) == 0) {
      // 不是自摸的不计单钓将
      that.m_abEnableRule[Define.FAN_DANDIAO] = false;
    }
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
//13 一色双龙会 一种花色的两个老少副，5为将牌。不计平和、七对、清一色
// 必然是七对、清一色
// 不计无字、缺一门、一般高，老少副
//
// **************************************************************************************
CJudge.prototype.Check1She2Long = function (sHuResult, that) {
  if (that.m_sStonesRelation.cnAllColors != 1)//|| sHuResult.nResultant != QIDUI)
  {
    // 必须是清一色
    return 0;
  }

  let i = 0;
  // 找到这个花色
  for (i = 0; i < 3; i++) {
    if (that.m_sStonesRelation.acnAllColors[i] != 0) {
      break;
    }
  }
  // 这个花色里，除4和6外，每样都要有两张
  i += (i << 3);
  for (let j = 0; j < 9; j++) {
    if (j == Define.STONE_NO4 || j == Define.STONE_NO6) {
      if (that.m_sStonesRelation.acnAllStones[i + j] != 0) {
        return 0;
      }
    }
    else if (that.m_sStonesRelation.acnAllStones[i + j] != 2) {
      return 0;
    }
  }

  //	for( let i = 0; i < 14; i++ )
  //	{
  //		if ( this.m_pCheckParam.asHandStone[i].nWhat == STONE_NO4
  //			|| this.m_pCheckParam.asHandStone[i].nWhat == STONE_NO6 )
  //		{
  //			return 0;
  //		}
  //	}

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_7DUI] = false;
  that.m_abEnableRule[Define.FAN_QING1SHE] = false;
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
  that.m_abEnableRule[Define.FAN_PINHU] = false;
  that.m_abEnableRule[Define.FAN_YIBANGAO] = false;
  that.m_abEnableRule[Define.FAN_LAOSHAOFU] = false;

  return 1;
}

//
//48番
// **************************************************************************************
//
//14 一色四同顺 一种花色4副序数相同的顺子，不计一色三节高、一般高、四归一
//
// **************************************************************************************
CJudge.prototype.Check1She4TongShun = function (sHuResult, that) {
  if (that.m_sGroupsRelation.cnShunGroups != 4) {
    return 0;
  }

  let nColor = sHuResult.asGroup[0].asStone[0].nColor;
  let nWhat = sHuResult.asGroup[0].asStone[0].nWhat;
  if (that.m_sGroupsRelation.acnShunGroups[nColor][nWhat] != 4) {
    return 0;
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_1SHE3JIEGAO] = false;
  that.m_abEnableRule[Define.FAN_YIBANGAO] = false;
  that.m_abEnableRule[Define.FAN_4GUI1] = false;
  that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
  return 1;
}

// **************************************************************************************
//
//15 一色四节高 一种花色4副依次递增一位数的刻子
// 不计一色三同顺、一色三节高、碰碰和
// 不计混四节
//
// **************************************************************************************
CJudge.prototype.Check1She4JieGao = function (sHuResult, that) {
  if (that.m_sGroupsRelation.cnKeGroups != 4) {
    return 0;
  }

  let nColor = sHuResult.asGroup[0].asStone[0].nColor;
  if (nColor > Define.COLOR_BING) {
    // 不是序数牌
    return 0;
  }

  let i = 0;
  for (i = 0; i < 9; i++) {
    if (that.m_sGroupsRelation.acnKeGroups[nColor][i] != 0) {
      break;
    }
  }
  if (i > 5) { // 最小的那个刻子，最多是6
    return 0;
  }
  for (let j = i; j < i + 4; j++) {
    if (that.m_sGroupsRelation.acnKeGroups[nColor][j] == 0) {
      return 0;
    }
  }

  //	BOOL bFindFirst = 0;
  //	for( let i = 0; i < 9; i++ )
  //	{
  //		if ( that.m_sGroupsRelation.acnKeGroups[nColor][i] == 0 )
  //		{
  //			if ( bFindFirst )
  //			{
  //				return 0;
  //			}
  //		}
  //		else if ( !bFindFirst )
  //		{
  //			bFindFirst = true;
  //		}
  //	}

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_1SHE3JIEGAO] = false;
  that.m_abEnableRule[Define.FAN_1SHE3TONGSHUN] = false;
  that.m_abEnableRule[Define.FAN_PENPENHU] = false;
  that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
  return 1;
}

//
//32番
// **************************************************************************************
//
//16 一色四步高 一种花色4副依次递增一位数或依次递增二位数的顺子
// 不计一色三步高，连六
//
// **************************************************************************************
CJudge.prototype.Check1She4BuGao = function (sHuResult, that) {
  if (that.m_sGroupsRelation.cnShunGroups != 4) {
    return 0;
  }
  let nColor = sHuResult.asGroup[0].asStone[0].nColor;
  let i = 0;
  for (i = 0; i < Define.STONE_NO5; i++) {
    // 第一个顺最大只能是456
    if (that.m_sGroupsRelation.acnShunGroups[nColor][i] != 0) {
      break;
    }
  }
  if (i == Define.STONE_NO5) {
    return 0;
  }
  if (that.m_sGroupsRelation.acnShunGroups[nColor][i + 1] != 1
    || that.m_sGroupsRelation.acnShunGroups[nColor][i + 2] != 1
    || that.m_sGroupsRelation.acnShunGroups[nColor][i + 3] != 1) {
    // 递增1没有符合要求的顺子
    if (i == 0) {
      // 如果第一顺是123，那么看看递增2行不行
      if (that.m_sGroupsRelation.acnShunGroups[nColor][i + 2] != 1
        || that.m_sGroupsRelation.acnShunGroups[nColor][i + 4] != 1
        || that.m_sGroupsRelation.acnShunGroups[nColor][i + 6] != 1) {
        return 0;
      }
    }
    else {
      // 没指望了
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_1SHE3BUGAO] = false;
  that.m_abEnableRule[Define.FAN_LIAN6] = false;
  that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
  return 1;
}

// **************************************************************************************
//
//17 三杠 3个杠
// 不计双明杠、双暗杠、明杠、暗杠
//
// **************************************************************************************
CJudge.prototype.Check3Gang = function (sHuResult, that) {
  if (that.m_pCheckParam.cnMinGang + that.m_pCheckParam.cnAnGang == 3) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_2MINGANG] = false;
    that.m_abEnableRule[Define.FAN_2ANGANG] = false;
    that.m_abEnableRule[Define.FAN_MINGANG] = false;
    that.m_abEnableRule[Define.FAN_ANGANG] = false;
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//18 混幺九 由字牌和序数牌一、九的刻子用将牌组成的各牌。不计碰碰和、幺九刻、全带幺
//
// **************************************************************************************
CJudge.prototype.CheckHun19 = function (sHuResult, that) {
  //	for( let i = 0; i < that.m_cnMaxHandStone; i++ )
  //	{
  //		if ( that.m_pCheckParam.asHandStone[i].nColor < COLOR_WIND )
  //		{
  //			// 序数牌，必须全是幺九
  //			if ( that.m_pCheckParam.asHandStone[i].nWhat != STONE_NO1
  //				&& that.m_pCheckParam.asHandStone[i].nWhat != STONE_NO9 )
  //			{
  //				return 0;
  //			}
  //		}
  //	}
  for (let i = 0; i < 27; i++) {
    if (i % 9 == 0 || i % 9 == 8) {
      continue;
    }
    if (that.m_sStonesRelation.acnAllStones[i] != 0) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_PENPENHU] = false;
  that.m_abEnableRule[Define.FAN_19KE] = false;
  that.m_abEnableRule[Define.FAN_QUANDAIYAO] = false;
  return 1;
}

//
//24番
// **************************************************************************************
//
//19 七对 由7个对子组成和牌。不计不求人、单钓、门清
//
// **************************************************************************************
CJudge.prototype.Check7Dui = function (sHuResult, that) {
  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_MENGQING] = false;
  that.m_abEnableRule[Define.FAN_BUQIUREN] = false;
  that.m_abEnableRule[Define.FAN_DANDIAO] = false;
  return 1;
}

// **************************************************************************************
//
//20 七星不靠 必须有7个单张的东西南北中发白，加上3种花色，数位按147、258、369中的7张序数
// 牌组成没有将牌的和牌。不计五门齐、不求人、单钓、门清、全不靠
//
// **************************************************************************************
CJudge.prototype.Check7XinBuKao = function (sHuResult, that) {
  if (sHuResult.nResultant != Define.QUANBUKAO) {
    return 0;
  }

  let cnWind = 0;
  for (let i = 0; i < that.m_cnMaxHandStone; i++) {
    if (sHuResult.asHandStone[i].nColor >= Define.COLOR_WIND) {
      cnWind++;
    }
  }
  if (cnWind != 7) {
    return 0;
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_MENGQING] = false;
  that.m_abEnableRule[Define.FAN_BUQIUREN] = false;
  that.m_abEnableRule[Define.FAN_DANDIAO] = false;
  that.m_abEnableRule[Define.FAN_5MENQI] = false;
  that.m_abEnableRule[Define.FAN_QUANBUKAO] = false;
  return 1;
}

// **************************************************************************************
//
//21 全双刻 由2、4、6、8序数牌的刻子、将牌组成的和牌。不计碰碰和、断幺、无字
//
// **************************************************************************************
CJudge.prototype.CheckQuanShuangKe = function (sHuResult, that) {
  if (that.m_sGroupsRelation.cnKeGroups != 4) {
    return 0;
  }

  for (let i = 0; i < that.m_cnMaxGroups; i++) {
    if ((sHuResult.asGroup[i].asStone[0].nWhat + 1) % 2 != 0) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_PENPENHU] = false;
  that.m_abEnableRule[Define.FAN_DUAN19] = false;
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  return 1;
}

// **************************************************************************************
//
//22 清一色 由一种花色的序数牌组成和牌。不计无字、缺一门
//
// **************************************************************************************
CJudge.prototype.CheckQing1She = function (sHuResult, that) {
  if (that.m_sStonesRelation.cnAllColors == 1) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
    that.m_abEnableRule[Define.FAN_WUZI] = false;
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
//23 一色三同顺 和牌时有一种花色3副序数相同的顺子。不计一色三节高
//
// **************************************************************************************
CJudge.prototype.Check1She3TongShun = function (sHuResult, that) {
  let i = 0;
  for (i = 0; i < 3; i++) {
    if (that.m_sStonesRelation.acnAllColors[i] >= 9) {
      break;
    }
  }
  if (i == 3) {
    // 没有一门有9张牌
    return 0;
  }
  for (let j = 0; j < 7; j++) {
    if (that.m_sGroupsRelation.acnShunGroups[i][j] == 3) {
      that.m_abEnableRule[Define.FAN_1SHE3JIEGAO] = false;
      that.m_abEnableRule[Define.FAN_YIBANGAO] = false;
      return 1;
    }
  }
  return 0;
}

// **************************************************************************************
//
//24 一色三节高 和牌时有一种花色3副依次递增一位数字的刻子。不计一色三同顺
//
// **************************************************************************************
CJudge.prototype.Check1She3JieGao = function (sHuResult, that) {
  let i = 0;
  for (i = 0; i < 3; i++) {
    if (that.m_sStonesRelation.acnAllColors[i] >= 9) {
      break;
    }
  }
  if (i == 3) {
    // 没有一门有9张牌
    return 0;
  }
  for (let j = 0; j < Define.STONE_NO8; j++) {
    if (that.m_sGroupsRelation.acnKeGroups[i][j] != 0
      && that.m_sGroupsRelation.acnKeGroups[i][j + 1] != 0
      && that.m_sGroupsRelation.acnKeGroups[i][j + 2] != 0) {
      that.m_abEnableRule[Define.FAN_1SHE3TONGSHUN] = false;
      return 1;
    }
  }
  return 0;
}

// **************************************************************************************
//
//25 全大 由序数牌789组成的顺子、刻子(杠)、将牌的和牌。不计无字、大于5
//
// **************************************************************************************
CJudge.prototype.CheckQuanDa = function (sHuResult, that) {
  let i = 0;
  for (i = 0; i < 3; i++) {
    for (let j = 0; j < Define.STONE_NO7; j++) {
      if (that.m_sStonesRelation.acnAllStones[i * 9 + j] != 0) {
        return 0;
      }
    }
  }
  for (i = 27; i < 34; i++) {
    // 不能有字
    if (that.m_sStonesRelation.acnAllStones[i] != 0) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_DAYU5] = false;
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  return 1;
}

// **************************************************************************************
//
//26 全中 由序数牌456组成的顺子、刻子(杠)、将牌的和牌。不计断幺、无字
//
// **************************************************************************************
CJudge.prototype.CheckQuanZhong = function (sHuResult, that) {
  let i = 0;
  for (i = 0; i < 3; i++) {
    for (let j = 0; j < 9; j++) {
      if (j == Define.STONE_NO4 || j == Define.STONE_NO5 || j == Define.STONE_NO6) {
        continue;
      }
      if (that.m_sStonesRelation.acnAllStones[i * 9 + j] != 0) {
        return 0;
      }
    }
  }
  for (i = 27; i < 34; i++) {
    // 不能有字
    if (that.m_sStonesRelation.acnAllStones[i] != 0) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_DUAN19] = false;
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  return 1;
}

// **************************************************************************************
//
//27 全小 由序数牌123组成的顺子、刻子(杠)将牌的的和牌。不计无字、小于5
//
// **************************************************************************************
CJudge.prototype.CheckQuanXiao = function (sHuResult, that) {
  let i = 0;
  for (i = 0; i < 3; i++) {
    for (let j = Define.STONE_NO4; j <= Define.STONE_NO9; j++) {
      if (that.m_sStonesRelation.acnAllStones[i * 9 + j] != 0) {
        return 0;
      }
    }
  }
  for (i = 27; i < 34; i++) {
    // 不能有字
    if (that.m_sStonesRelation.acnAllStones[i] != 0) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_XIAOYU5] = false;
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  return 1;
}

//
//16番
// **************************************************************************************
//
//28 清龙 和牌时，有一种花色1-9相连接的序数牌
// 不计六连张.老少配
// 不计混龙
//
// **************************************************************************************
CJudge.prototype.CheckQingLong = function (sHuResult, that) {
  let i = 0;
  for (i = 0; i < 3; i++) {
    if (that.m_sStonesRelation.acnAllColors[i] >= 9) {
      break;
    }
  }
  if (i == 3) {
    // 没有一门有9张牌
    return 0;
  }
  if (that.m_sGroupsRelation.acnShunGroups[i][0] >= 1
    && that.m_sGroupsRelation.acnShunGroups[i][3] >= 1
    && that.m_sGroupsRelation.acnShunGroups[i][6] >= 1) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_LIAN6] = false;
    that.m_abEnableRule[Define.FAN_LAOSHAOFU] = false;
    that.m_abEnableRule[Define.FAN_HUNLONG] = false;
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
//29 三色双龙会 2种花色2个老少副、另一种花色5作将的和牌。不计喜相逢、老少副、无字、平和
//
// **************************************************************************************
CJudge.prototype.Check3She2Long = function (sHuResult, that) {
  // 将牌必须是5
  let nJongColor = sHuResult.asGroup[that.m_cnMaxGroups - 1].asStone[0].nColor;
  if (that.m_sGroupsRelation.cnShunGroups != 4
    || sHuResult.asGroup[that.m_cnMaxGroups - 1].asStone[0].nWhat != Define.STONE_NO5
    || that.m_sStonesRelation.acnAllColors[nJongColor] != 2) {
    return 0;
  }

  for (let i = 0; i < 3; i++) {
    if (i == nJongColor) {
      continue;
    }

    if (that.m_sGroupsRelation.acnShunGroups[i][0] != 1
      || that.m_sGroupsRelation.acnShunGroups[i][6] != 1) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_XIXIANGFENG] = false;
  that.m_abEnableRule[Define.FAN_LAOSHAOFU] = false;
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  that.m_abEnableRule[Define.FAN_PINHU] = false;
  return 1;
}

// **************************************************************************************
//
//30 一色三步高 和牌时，有一种花色3副依次递增一位或依次递增二位数字的顺子
//
// **************************************************************************************
CJudge.prototype.Check1She3BuGao = function (sHuResult, that) {
  let i = 0;
  for (i = 0; i < 3; i++) {
    if (that.m_sStonesRelation.acnAllColors[i] >= 9) {
      break;
    }
  }
  if (i == 3) {
    // 没有一门有9张牌
    return 0;
  }

  let j = 0;
  for (j = 0; j < Define.STONE_NO6; j++) {
    // 第一个顺最大只能是567
    if (that.m_sGroupsRelation.acnShunGroups[i][j] == 0) {
      continue;
    }

    if (that.m_sGroupsRelation.acnShunGroups[i][j + 1] != 0
      && that.m_sGroupsRelation.acnShunGroups[i][j + 2] != 0) {
      // 步进一成功
      break;
    }

    if (j < Define.STONE_NO4) {
      // 如果第一顺小于456看看步进2有没有满足要求的顺
      if (that.m_sGroupsRelation.acnShunGroups[i][j + 2] != 0
        && that.m_sGroupsRelation.acnShunGroups[i][j + 4] != 0) {
        break;
      }
    }
  }
  if (j == Define.STONE_NO6) {
    return 0;
  }

  return 1;
}

// **************************************************************************************
//
//31 全带五 每副牌及将牌必须有5的序数牌。不计断幺,无字
//
// **************************************************************************************
CJudge.prototype.CheckQuanDai5 = function (sHuResult, that) {
  for (let i = 0; i < that.m_cnMaxGroups; i++) {
    let j = 0;
    for (j = 0; j < 4; j++) {
      if (sHuResult.asGroup[i].asStone[j].nWhat == Define.STONE_NO5) {
        // 这一组里有个5，其它牌不用看了
        break;
      }
    }
    if (j == 4) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_DUAN19] = false;
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  return 1;
}

// **************************************************************************************
//
//32 三同刻 3个序数相同的刻子(杠)
// 不计双同刻
//
// **************************************************************************************
CJudge.prototype.Check3TongKe = function (sHuResult, that) {
  for (let i = 0; i <= Define.STONE_NO9; i++) {
    if (that.m_sGroupsRelation.acnKeGroups[Define.COLOR_WAN][i] != 0
      && that.m_sGroupsRelation.acnKeGroups[Define.COLOR_BING][i] != 0
      && that.m_sGroupsRelation.acnKeGroups[Define.COLOR_TIAO][i] != 0) {
      // 屏蔽掉不计的番种
      that.m_abEnableRule[Define.FAN_2TONGKE] = false;
      return 1;
    }
  }
  return 0;
}

// **************************************************************************************
//
//33 三暗刻 3个暗刻
// 不计双暗刻
//
// **************************************************************************************
CJudge.prototype.Check3AnKe = function (sHuResult, that) {
  // 暗刻数
  let cnAnKe = 0;
  for (let i = that.m_pCheckParam.cnShowGroups; i < that.m_cnMaxGroups; i++) {
    if (sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_KE) {
      // 如果不是自摸和牌，成和的那一刻不能算暗刻
      if ((that.m_pCheckParam.nWinMode & Define.WIN_MODE_ZIMO) == 0
        && (sHuResult.asGroup[i].asStone[0].nID == that.m_pCheckParam.asHandStone[0].nID
          || sHuResult.asGroup[i].asStone[1].nID == that.m_pCheckParam.asHandStone[0].nID
          || sHuResult.asGroup[i].asStone[2].nID == that.m_pCheckParam.asHandStone[0].nID)) {
        continue;
      }
      cnAnKe++;
    }
  }

  if (cnAnKe + that.m_pCheckParam.cnAnGang >= 3) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_2ANKE] = false;
    return 1;
  }

  return 0;
}

//
//12番
// **************************************************************************************
//
//34 全不靠 由单张3种花色147、258、369不能错位的序数牌及东南西北中发白中的任何14张牌组成
// 的和牌。不计五门齐、不求人、单钓、门清
//
// **************************************************************************************
CJudge.prototype.CheckQuanBuKao = function (sHuResult, that) {
  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_5MENQI] = false;
  that.m_abEnableRule[Define.FAN_BUQIUREN] = false;
  that.m_abEnableRule[Define.FAN_DANDIAO] = false;
  that.m_abEnableRule[Define.FAN_MENGQING] = false;
  return 1;
}

// **************************************************************************************
//
//35 组合龙 3种花色的147、258、369不能错位的序数牌
//
// **************************************************************************************
CJudge.prototype.CheckZhuHeLong = function (sHuResult, that) {
  if (sHuResult.nResultant == Define.QUANBUKAO) {
    // 全不靠和牌，字牌数最多只能有5张
    let cnWind = 0;
    for (let i = 0; i < that.m_cnMaxHandStone; i++) {
      if (sHuResult.asHandStone[i].nColor >= Define.COLOR_WIND)
      //				if ( that.m_pCheckParam.asHandStone[i].nColor >= COLOR_WIND )
      {
        cnWind++;
      }
    }
    if (cnWind > 5) {
      return 0;
    }
  }
  return 1;
}

// **************************************************************************************
//
//36 大于五 由序数牌6-9的顺子、刻子、将牌组成的和牌。不计无字
//
// **************************************************************************************
CJudge.prototype.CheckDaYu5 = function (sHuResult, that) {
  let i = 0;
  for (i = 0; i < 3; i++) {
    for (let j = 0; j < Define.STONE_NO6; j++) {
      if (that.m_sStonesRelation.acnAllStones[i * 9 + j] != 0) {
        return 0;
      }
    }
  }
  for (i = 27; i < 34; i++) {
    // 不能有字
    if (that.m_sStonesRelation.acnAllStones[i] != 0) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  return 1;
}

// **************************************************************************************
//
//37 小于五 由序数牌1-4的顺子、刻子、将牌组成的和牌。不计无字
//
// **************************************************************************************
CJudge.prototype.CheckXiaoYu5 = function (sHuResult, that) {
  let i = 0;
  for (i = 0; i < 3; i++) {
    for (let j = Define.STONE_NO5; j <= Define.STONE_NO9; j++) {
      if (that.m_sStonesRelation.acnAllStones[i * 9 + j] != 0) {
        return 0;
      }
    }
  }
  for (i = 27; i < 34; i++) {
    // 不能有字
    if (that.m_sStonesRelation.acnAllStones[i] != 0) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  // that.m_abEnableRule[Define.FAN_XIAOYU5] = false;
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  return 1;
}

// **************************************************************************************
//
//38 三风刻 3个风刻 不计缺一门
//
// **************************************************************************************
CJudge.prototype.Check3FengKe = function (sHuResult, that) {
  let cnWind = 0;
  for (let i = 0; i < that.m_cnMaxGroups - 1; i++) {// 最后一组是将牌
    if (sHuResult.asGroup[i].asStone[0].nColor == Define.COLOR_WIND) {
      cnWind++;
    }
  }

  if (cnWind == 3) {
    that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
    return 1;
  }

  return 0;
}

//
//8 番
// **************************************************************************************
//
//39 花龙 3种花色的3副顺子连接成1-9的序数牌
// 不计混龙
//
// **************************************************************************************
CJudge.prototype.CheckHuaLong = function (sHuResult, that) {
  for (let i = 0; i < 3; i++) {
    if (that.m_sGroupsRelation.acnShunGroups[i][Define.STONE_NO1] != 0) {
      // 本花色有123，看看其它两个花色有没有456和789
      let nColor1 = (i + 1) % 3;
      let nColor2 = (i + 2) % 3;
      if (that.m_sGroupsRelation.acnShunGroups[nColor1][Define.STONE_NO4] != 0
        && that.m_sGroupsRelation.acnShunGroups[nColor2][Define.STONE_NO7] != 0
        || that.m_sGroupsRelation.acnShunGroups[nColor2][Define.STONE_NO4] != 0
        && that.m_sGroupsRelation.acnShunGroups[nColor1][Define.STONE_NO7] != 0) {
        that.m_abEnableRule[Define.FAN_HUNLONG] = false;
        return 1;
      }
    }
  }

  return 0;
}

// **************************************************************************************
//
//40 推不倒 由牌面图形没有上下区别的牌组成的和牌，包括1234589饼、245689条、白板。
// 不计缺一门
//
// **************************************************************************************
CJudge.prototype.CheckTuiBuDao = function (sHuResult, that) {
  let acnMaxStones = [0, 0, 0, 0, 0, 0, 0, 0, 0, //万
    0, 8, 0, 8, 8, 8, 0, 8, 8, //条
    8, 8, 8, 8, 8, 0, 0, 8, 8, //饼
    0, 0, 0, 0,				// 风
    0, 0, 4];					// 箭
  for (let i = 0; i < 34; i++) {
    if (that.m_sStonesRelation.acnAllStones[i] > acnMaxStones[i]) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
  return 1;
}

// **************************************************************************************
//
//41 三色三同顺 和牌时，有3种花色3副序数相同的顺子
//
// **************************************************************************************
CJudge.prototype.Check3She3TongShun = function (sHuResult, that) {
  for (let i = 0; i < 7; i++) {
    if (that.m_sGroupsRelation.acnShunGroups[Define.COLOR_WAN][i] != 0
      && that.m_sGroupsRelation.acnShunGroups[Define.COLOR_TIAO][i] != 0
      && that.m_sGroupsRelation.acnShunGroups[Define.COLOR_BING][i] != 0) {
      that.m_abEnableRule[Define.FAN_XIXIANGFENG] = false;
      return 1;
    }
  }

  return 0;
}

// **************************************************************************************
//
//42 三色三节高 和牌时，有3种花色3副依次递增一位数的刻子
// 不计混三节
//
// **************************************************************************************
CJudge.prototype.Check3She3JieGao = function (sHuResult, that) {
  let i = 0;
  // 找出只有一个刻子的花色
  for (i = 0; i < 3; i++) {
    if (that.m_sStonesRelation.acnAllColors[i] == 3 || that.m_sStonesRelation.acnAllColors[i] == 4) {
      // 要找的就是它
      break;
    }
    else if (that.m_sStonesRelation.acnAllColors[i] == 0) {
      // 居然缺门
      return 0;
    }
  }
  if (i == 3) {
    // 没有哪个花色只有3张，肯定是没有三色三节高的
    return 0;
  }

  // 另外两个花色
  let nColor1 = (i + 1) % 3;
  let nColor2 = (i + 2) % 3;

  // 找出这个刻子
  let j = 0;
  for (j = 0; j <= Define.STONE_NO9; j++) {
    if (that.m_sGroupsRelation.acnKeGroups[i][j] != 0) {
      break;
    }
  }
  if (j > Define.STONE_NO9) {
    // 没刻子
    return 0;
  }

  // 共6种组合方式(数字表示刚找到的那个刻)
  // 1二三
  // 1三二
  // 一2三
  // 三2一
  // 一二3
  // 二一3
  let anIndex = [[], [], []];

  anIndex[0][0] = j + 2 <= Define.STONE_NO9 ? j + 1 : 0xff;
  anIndex[0][1] = j + 2 <= Define.STONE_NO9 ? j + 2 : 0xff;
  anIndex[1][0] = (j - 1 >= Define.STONE_NO1 && j + 1 <= Define.STONE_NO9) ? j - 1 : 0xff;
  anIndex[1][1] = (j - 1 >= Define.STONE_NO1 && j + 1 <= Define.STONE_NO9) ? j + 1 : 0xff;
  anIndex[2][0] = j - 2 >= Define.STONE_NO1 ? j - 2 : 0xff;
  anIndex[2][1] = j - 2 >= Define.STONE_NO1 ? j - 1 : 0xff;

  for (i = 0; i < 3; i++) {
    if (anIndex[i][0] != 0xff) {
      if (that.m_sGroupsRelation.acnKeGroups[nColor1][anIndex[i][0]] != 0
        && that.m_sGroupsRelation.acnKeGroups[nColor2][anIndex[i][1]] != 0
        || that.m_sGroupsRelation.acnKeGroups[nColor2][anIndex[i][0]] != 0
        && that.m_sGroupsRelation.acnKeGroups[nColor1][anIndex[i][1]] != 0) {
        that.m_abEnableRule[Define.FAN_HUN3JIE] = false;
        return 1;
      }
    }
  }

  return 0;
}

// **************************************************************************************
//
//43 无番和 和牌后，数不出任何番种分(花牌不计算在内)
//
// **************************************************************************************
CJudge.prototype.CheckWuFan = function (sHuResult, that) {
  return 0;
}

// **************************************************************************************
//
//44 妙手回春 自摸牌墙上最后一张牌和牌。不计自摸
//
// **************************************************************************************
CJudge.prototype.CheckMiaoShou = function (sHuResult, that) {
  that.m_abEnableRule[Define.FAN_ZIMO] = false;
  return 0;
}

// **************************************************************************************
//
//45 海底捞月 和打出的最后一张牌
//
// **************************************************************************************
CJudge.prototype.CheckHaiDi = function (sHuResult, that) {
  return 0;
}

// **************************************************************************************
//
//46 杠上开花 开杠抓进的牌成和牌(不包括补花)不计自摸
//
// **************************************************************************************
CJudge.prototype.CheckGangHu = function (sHuResult, that) {
  if (that.m_pCheckParam.nWinMode & Define.WIN_MODE_GANGSHANGHU) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_ZIMO] = false;
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
//47 抢杠和 和别人自抓开明杠的牌。不计和绝张
//
// **************************************************************************************
CJudge.prototype.CheckQiangGang = function (sHuResult, that) {
  if (that.m_pCheckParam.nWinMode & Define.WIN_MODE_QIANGGANG) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_HUJUEZHANG] = false;
    return 1;
  }

  return 0;
}

//
//6 番
// **************************************************************************************
//
//48 碰碰和 由4副刻子(或杠)、将牌组成的和牌
//
// **************************************************************************************
CJudge.prototype.CheckPenPenHu = function (sHuResult, that) {
  let count = 0;
  for (let i = 0; i < that.m_sOriginalStoneRelation.acnAllStones.length; i++) {
    if (that.m_sOriginalStoneRelation.acnAllStones[i] == 1) {
      return 0;
    }
    if (that.m_sOriginalStoneRelation.acnAllStones[i] == 2) {
      count++;
      if (count > 1) {
        return 0;
      }
    }
  }
  return 1;
}

// **************************************************************************************
//
//49 混一色 由一种花色序数牌及字牌组成的和牌
//
// **************************************************************************************
CJudge.prototype.CheckHun1She = function (sHuResult, that) {
  if (that.m_sOriginalStoneRelation.acnAllColors[0] > 0 && that.m_sOriginalStoneRelation.acnAllColors[1] == 0 && that.m_sOriginalStoneRelation.acnAllColors[2] == 0 && (that.m_sOriginalStoneRelation.acnAllColors[3] > 0 || that.m_sOriginalStoneRelation.acnAllColors[4] > 0)) {
    that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
    return 1;
  }
  if (that.m_sOriginalStoneRelation.acnAllColors[1] > 0 && that.m_sOriginalStoneRelation.acnAllColors[0] == 0 && that.m_sOriginalStoneRelation.acnAllColors[2] == 0 && (that.m_sOriginalStoneRelation.acnAllColors[3] > 0 || that.m_sOriginalStoneRelation.acnAllColors[4] > 0)) {
    that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
    return 1;
  }
  if (that.m_sOriginalStoneRelation.acnAllColors[2] > 0 && that.m_sOriginalStoneRelation.acnAllColors[0] == 0 && that.m_sOriginalStoneRelation.acnAllColors[1] == 0 && (that.m_sOriginalStoneRelation.acnAllColors[3] > 0 || that.m_sOriginalStoneRelation.acnAllColors[4] > 0)) {
    that.m_abEnableRule[Define.FAN_QUE1MEN] = false;
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//50 三色三步高 3种花色3副依次递增一位序数的顺子
// 不计混三步
//
// **************************************************************************************
CJudge.prototype.Check3She3BuGao = function (sHuResult, that) {
  let i = 0;
  // 找出刚好只有一顺的花色
  for (i = 0; i < 3; i++) {
    if (that.m_sStonesRelation.acnAllColors[i] == 3) {
      // 要找的就是它
      break;
    }
    else if (that.m_sStonesRelation.acnAllColors[i] == 0) {
      // 居然缺门
      return 0;
    }
  }
  if (i == 3) {
    // 没有哪个花色只有3张，肯定是没有三色三步高的
    return 0;
  }

  // 另外两个花色
  let nColor1 = (i + 1) % 3;
  let nColor2 = (i + 2) % 3;

  // 找出这个顺子
  let j = 0;
  for (j = 0; j <= Define.STONE_NO7; j++) {
    if (that.m_sGroupsRelation.acnShunGroups[i][j] != 0) {
      break;
    }
  }
  if (j > Define.STONE_NO7) {
    // 没顺子
    return 0;
  }

  // 共6种组合方式(数字表示刚找到的那个顺)
  // 1二三
  // 1三二
  // 一2三
  // 三2一
  // 一二3
  // 二一3
  let anIndex = [[], [], []];
  anIndex[0][0] = j + 2 <= Define.STONE_NO7 ? j + 1 : 0xff;
  anIndex[0][1] = j + 2 <= Define.STONE_NO7 ? j + 2 : 0xff;
  anIndex[1][0] = (j - 1 >= Define.STONE_NO1 && j + 1 <= Define.STONE_NO7) ? j - 1 : 0xff;
  anIndex[1][1] = (j - 1 >= Define.STONE_NO1 && j + 1 <= Define.STONE_NO7) ? j + 1 : 0xff;
  anIndex[2][0] = j - 2 >= Define.STONE_NO1 ? j - 2 : 0xff;
  anIndex[2][1] = j - 2 >= Define.STONE_NO1 ? j - 1 : 0xff;

  for (i = 0; i < 3; i++) {
    if (anIndex[i][0] != 0xff) {
      if (that.m_sGroupsRelation.acnShunGroups[nColor1][anIndex[i][0]] != 0
        && that.m_sGroupsRelation.acnShunGroups[nColor2][anIndex[i][1]] != 0
        || that.m_sGroupsRelation.acnShunGroups[nColor2][anIndex[i][0]] != 0
        && that.m_sGroupsRelation.acnShunGroups[nColor1][anIndex[i][1]] != 0) {
        that.m_abEnableRule[Define.FAN_HUN3BU] = false;
        return 1;
      }
    }
  }

  return 0;
}

// **************************************************************************************
//
//51 五门齐 和牌时3种序数牌、风、箭牌齐全
//
// **************************************************************************************
CJudge.prototype.Check5MenQi = function (sHuResult, that) {
  for (let i = 0; i < that.m_sOriginalStoneRelation.acnAllColors.length; i++) {
    if (that.m_sOriginalStoneRelation.acnAllColors[i] <= 0) {
      return 0;
    }
  }

  return 1;
}

// **************************************************************************************
//
//52 全求人 全靠吃牌、碰牌、单钓别人批出的牌和牌。不计单钓
//
// **************************************************************************************
CJudge.prototype.CheckQuanQiuRen = function (sHuResult, that) {
  if (that.m_pCheckParam.cnShowGroups == that.m_cnMaxGroups - 1
    && that.m_pCheckParam.cnAnGang == 0
    && (that.m_pCheckParam.nWinMode & Define.WIN_MODE_ZIMO) == 0) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_DANDIAO] = false;
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
//53 双暗杠 2个暗杠,不计双暗刻
//
// **************************************************************************************
CJudge.prototype.Check2AnGang = function (sHuResult, that) {
  if (that.m_pCheckParam.cnAnGang == 2) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_2ANKE] = false;
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//54 双箭刻 2副箭刻(或杠)
// 不计箭刻
//
// **************************************************************************************
CJudge.prototype.Check2JianKe = function (sHuResult, that) {
  if (that.m_sGroupsRelation.acnKeGroups[Define.COLOR_JIAN][0]
    + that.m_sGroupsRelation.acnKeGroups[Define.COLOR_JIAN][1]
    + that.m_sGroupsRelation.acnKeGroups[Define.COLOR_JIAN][2] == 2) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_JIANKE] = false;
    return 1;
  }

  return 0;
}

//
//4 番
// **************************************************************************************
//
//55 全带幺 和牌时，每副牌、将牌都有幺牌
//
// **************************************************************************************
CJudge.prototype.CheckQuanDai1 = function (sHuResult, that) {
  for (let i = 0; i < that.m_cnMaxGroups; i++) {
    let cnStones = 1;
    if (sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_SHUN) {
      cnStones = 3;
    }
    let j = 0;
    for (j = 0; j < cnStones; j++) {
      if (sHuResult.asGroup[i].asStone[j].nColor >= Define.COLOR_WIND
        || sHuResult.asGroup[i].asStone[j].nWhat == Define.STONE_NO1
        || sHuResult.asGroup[i].asStone[j].nWhat == Define.STONE_NO9) {
        break;
      }
    }
    if (j == cnStones) {
      return 0;
    }
  }

  return 1;
}

// **************************************************************************************
//
//56 不求人 4副牌及将中没有吃牌、碰牌(包括明杠)，自摸和牌
// 不计门清、自摸
//
// **************************************************************************************
CJudge.prototype.CheckBuQiuRen = function (sHuResult, that) {
  if (that.m_pCheckParam.cnShowGroups == that.m_pCheckParam.cnAnGang
    && (that.m_pCheckParam.nWinMode & Define.WIN_MODE_ZIMO)) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_MENGQING] = false;
    that.m_abEnableRule[Define.FAN_ZIMO] = false;
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//57 双明杠 2个明杠
// 不计明杠
//
// **************************************************************************************
CJudge.prototype.Check2MinGang = function (sHuResult, that) {
  if (that.m_pCheckParam.cnMinGang == 2) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_MINGANG] = false;
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//58 和绝张 和牌池、桌面已亮明的3张牌所剩的第4张牌(抢杠和不计和绝张)
//
// **************************************************************************************
CJudge.prototype.CheckHuJueZhang = function (sHuResult, that) {
  if (that.m_pCheckParam.nWinMode & Define.WIN_MODE_HUJUEZHANG) {
    return 1;
  }
  return 0;
}

//
//2 番
// **************************************************************************************
//
//59 箭刻 由中、发、白3张相同的牌组成的刻子
//
// **************************************************************************************
CJudge.prototype.CheckJianKe = function (sHuResult, that) {
  if (that.m_sGroupsRelation.acnKeGroups[Define.COLOR_JIAN][0] != 0
    || that.m_sGroupsRelation.acnKeGroups[Define.COLOR_JIAN][1] != 0
    || that.m_sGroupsRelation.acnKeGroups[Define.COLOR_JIAN][2] != 0) {
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
//60 圈风刻 与圈风相同的风刻
//
// **************************************************************************************
CJudge.prototype.CheckQuanFeng = function (sHuResult, that) {
  let nQuanWhat = that.m_pCheckParam.nQuanWind;
  if (that.m_sGroupsRelation.acnKeGroups[Define.COLOR_WIND][nQuanWhat] != 0) {
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//61 门风刻 与本门风相同的风刻
//
// **************************************************************************************
CJudge.prototype.CheckMenFeng = function (sHuResult, that) {
  let nMenWhat = (that.m_pCheckParam.nMenWind & 0x00f0) >> 4;
  if (that.m_sGroupsRelation.acnKeGroups[Define.COLOR_WIND][nMenWhat] != 0) {
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//62 门前清 没有吃、碰、明杠，和别人打出的牌
//
// **************************************************************************************
CJudge.prototype.CheckMenQing = function (sHuResult, that) {
  if (that.m_pCheckParam.cnShowGroups == that.m_pCheckParam.cnAnGang) {
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//63 平和 由4副顺子及序数牌作将组成的和牌，边、坎、钓不影响平和
// 不计无字
//
// **************************************************************************************
CJudge.prototype.CheckPinHu = function (sHuResult, that) {
  // 不能有字牌
  let i = 0;
  for (i = 27; i < 34; i++) {
    if (that.m_sStonesRelation.acnAllStones[i] != 0) {
      return 0;
    }
  }

  // 不能有刻子
  for (i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_KE) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  return 1;
}

// **************************************************************************************
//
//64 四归一 和牌中，有4张相同的牌归于一家的顺、刻子、对、将牌中(不包括杠牌)
//
// **************************************************************************************
CJudge.prototype.Check4Gui1 = function (sHuResult, that) {
  let cnSame4Stone = 0;
  for (let i = 0; i < 34; i++) {
    if (that.m_sOriginalStoneRelation.acnAllStones[i] >= 4) {
      cnSame4Stone++;
    }
  }

  return cnSame4Stone - that.m_pCheckParam.cnAnGang - that.m_pCheckParam.cnMinGang;
}

// **************************************************************************************
//
//65 双同刻 2副序数相同的刻子
//
// **************************************************************************************
CJudge.prototype.Check2TongKe = function (sHuResult, that) {
  let cnTongKe = 0;
  for (let i = 0; i <= Define.STONE_NO9; i++) {
    if (that.m_sGroupsRelation.acnKeGroups[Define.COLOR_WAN][i]
      + that.m_sGroupsRelation.acnKeGroups[Define.COLOR_BING][i]
      + that.m_sGroupsRelation.acnKeGroups[Define.COLOR_TIAO][i] >= 2) {
      cnTongKe++;
    }
  }

  if (cnTongKe > 0) {
    // 屏蔽掉不计的番种
    that.m_abEnableRule[Define.FAN_2TONGKE] = false;
  }

  return cnTongKe;
}

// **************************************************************************************
//
//66 双暗刻 2个暗刻
//
// **************************************************************************************
CJudge.prototype.Check2AnKe = function (sHuResult, that) {
  // 暗刻数
  let cnAnKe = 0;
  for (let i = that.m_pCheckParam.cnShowGroups; i < that.m_cnMaxGroups; i++) {
    if (sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_KE) {
      // 如果不是自摸和牌，成和的那一刻不能算暗刻
      if ((that.m_pCheckParam.nWinMode & Define.WIN_MODE_ZIMO) == 0
        && (sHuResult.asGroup[i].asStone[0].nID == that.m_pCheckParam.asHandStone[0].nID
          || sHuResult.asGroup[i].asStone[1].nID == that.m_pCheckParam.asHandStone[0].nID
          || sHuResult.asGroup[i].asStone[2].nID == that.m_pCheckParam.asHandStone[0].nID)) {
        continue;
      }
      cnAnKe++;
    }
  }

  if (cnAnKe + that.m_pCheckParam.cnAnGang == 2) {
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
//67 暗杠 自抓4张相同的牌开杠
//
// **************************************************************************************
CJudge.prototype.CheckAnGang = function (sHuResult, that) {
  if (that.m_pCheckParam.cnAnGang == 1) {
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
//68 断幺 和牌中没有一、九及字牌 1 番
// 不计无字
//
// **************************************************************************************
CJudge.prototype.CheckDuan19 = function (sHuResult, that) {
  let i = 0;
  for (i = 0; i < 3; i++) {
    if (that.m_sStonesRelation.acnAllStones[i * 9] != 0
      || that.m_sStonesRelation.acnAllStones[i * 9 + Define.STONE_NO9] != 0) {
      return 0;
    }
  }
  for (i = 3; i < 5; i++) {
    if (that.m_sStonesRelation.acnAllColors[i] != 0) {
      return 0;
    }
  }

  // 屏蔽掉不计的番种
  that.m_abEnableRule[Define.FAN_WUZI] = false;
  return 1;
}

// **************************************************************************************
//
//69 一般高 由一种花色2副相同的顺子组成的牌
//
// **************************************************************************************
CJudge.prototype.CheckYiBanGao = function (sHuResult, that) {
  let cnSame2Shun = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 7; j++) {
      if (that.m_sGroupsRelation.acnShunGroups[i][j] == 2) {
        cnSame2Shun++;
      }
    }
  }
  return cnSame2Shun;
}

// **************************************************************************************
//
//70 喜相逢 2种花色2副序数相同的顺子
//
// **************************************************************************************
CJudge.prototype.CheckXiXiangFeng = function (sHuResult, that) {
  let cnXiXiangFeng = 0;
  for (let i = 0; i <= Define.STONE_NO7; i++) {
    if (((that.m_sGroupsRelation.acnShunGroups[Define.COLOR_WAN][i] != 0 ? 1 : 0)
      + (that.m_sGroupsRelation.acnShunGroups[Define.COLOR_TIAO][i] != 0 ? 1 : 0)
      + (that.m_sGroupsRelation.acnShunGroups[Define.COLOR_BING][i] != 0 ? 1 : 0)) == 2) {
      cnXiXiangFeng++;
    }
  }
  return cnXiXiangFeng;
}

// **************************************************************************************
//
//71 连六 一种花色6张相连接的序数牌
//
// **************************************************************************************
CJudge.prototype.CheckLian6 = function (sHuResult, that) {
  let cnLian6 = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j <= Define.STONE_NO4; j++) {
      // 第一顺最大只能是456
      if (that.m_sGroupsRelation.acnShunGroups[i][j] != 0
        && that.m_sGroupsRelation.acnShunGroups[i][j + 3] != 0) {
        cnLian6++;
      }
    }
  }
  return cnLian6;
}

// **************************************************************************************
//
//72 老少副 一种花色牌的123、789两副顺子
//
// **************************************************************************************
CJudge.prototype.CheckLaoShaoFu = function (sHuResult, that) {
  let cnLaoShaoFu = 0;
  for (let i = 0; i < 3; i++) {
    if (that.m_sGroupsRelation.acnShunGroups[i][Define.STONE_NO1] != 0
      && that.m_sGroupsRelation.acnShunGroups[i][Define.STONE_NO7] != 0) {
      cnLaoShaoFu++;
    }
  }
  return cnLaoShaoFu;
}

// **************************************************************************************
//
//73 幺九刻 3张相同的一、九序数牌及字牌组成的刻子(或杠)
// 风刻有三个或以上以则所有风刻不计幺九刻
// 与圈风或门风相同的风刻不计幺九刻
// 箭牌不计幺九刻
//
// **************************************************************************************
CJudge.prototype.Check19Ke = function (sHuResult, that) {
  let cn19Ke = 0;
  let i = 0;
  for (i = 0; i < 3; i++) {
    cn19Ke += that.m_sGroupsRelation.acnKeGroups[i][Define.STONE_NO1] + that.m_sGroupsRelation.acnKeGroups[i][Define.STONE_NO9];
  }

  let cnWind = 0;
  for (i = 0; i < 4; i++) {
    if (that.m_sGroupsRelation.acnKeGroups[Define.COLOR_WIND][i] > 0) {
      cnWind++;
    }
  }
  if (cnWind >= 3) {
    // 风刻有三个或以上以则所有风刻不计幺九刻
    return cn19Ke;
  }

  for (i = 0; i < 4; i++) {
    if (!(i == that.m_pCheckParam.nQuanWind || i == that.m_pCheckParam.nMenWind)) {
      cn19Ke += that.m_sGroupsRelation.acnKeGroups[Define.COLOR_WIND][i];
    }
  }
  return cn19Ke;
}

// **************************************************************************************
//
//74 明杠 自己有暗刻，碰别人打出的一张相同的牌开杠：或自己抓进一张与碰的明刻相同的牌开杠
//
// **************************************************************************************
CJudge.prototype.CheckMinGang = function (sHuResult, that) {
  if (that.m_pCheckParam.cnMinGang == 1) {
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//75 缺一门 和牌中缺少一种花色序数牌
//
// **************************************************************************************
CJudge.prototype.CheckQue1Men = function (sHuResult, that) {
  let cnQueMeng = 0;
  for (let i = 0; i < 3; i++) {
    if (that.m_sStonesRelation.acnAllColors[i] == 0) {
      cnQueMeng++;
    }
  }
  if (cnQueMeng == 1) {
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//76 无字 和牌中没有风、箭牌
//
// **************************************************************************************
CJudge.prototype.CheckWuZi = function (sHuResult, that) {
  if (that.m_sStonesRelation.acnAllColors[Define.COLOR_WIND]
    + that.m_sStonesRelation.acnAllColors[Define.COLOR_JIAN] == 0) {
    return 1;
  }
  return 0;
}

// **************************************************************************************
//
//77 边张 单和123的3及789的7或1233和3、77879和7都为边张。手中有12345和3，56789和7不算边张
// 20170204
// **************************************************************************************
CJudge.prototype.CheckBianZang = function (sHuResult, that) {
  if ((that.m_pCheckParam.nWinMode & Define.WIN_MODE_TIANHU) == Define.WIN_MODE_TIANHU) {
    // 天和不计边坎钓
    return 0;
  }

  // 先搜索到最后摸的那张牌的花色、数字和所在分组号
  let sWinTileInfo = new Define.tagTileInfo();
  if (!that.GetTileInfo(that.m_pCheckParam.asHandStone[0].nID, sHuResult.asGroup, sWinTileInfo)) {
    // 居然没找到
    return 0;
  }

  if (sHuResult.asGroup[sWinTileInfo.nGroupIndex].nGroupStyle != Define.GROUP_STYLE_SHUN) {
    // 不是顺
    return 0;
  }

  let nNoWhat;	// 不能有这张牌作顺的第一张的顺子
  if (sWinTileInfo.nWhat == Define.STONE_NO3) {
    if (sWinTileInfo.nIndex != 2) {
      // 不是边顺
      return 0;
    }
    nNoWhat = Define.STONE_NO3;
  }
  else if (sWinTileInfo.nWhat == Define.STONE_NO7) {
    if (sWinTileInfo.nIndex != 0) {
      // 不是边顺
      return 0;
    }
    nNoWhat = Define.STONE_NO5;
  }
  else {
    return 0;
  }

  for (let i = sHuResult.cnShowGroups; i < sHuResult.cnGroups - 1; i++) {// 最后一对是将牌
    if (sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_SHUN
      && sHuResult.asGroup[i].asStone[0].nColor == sWinTileInfo.nColor
      && sHuResult.asGroup[i].asStone[0].nWhat == nNoWhat) {
      // 不能有其它用本张作为头一张(3)或最后一张(7)组成的顺
      return 0;
    }
  }

  // 不计坎张和单钓将
  that.m_abEnableRule[Define.FAN_KANZANG] = false;
  that.m_abEnableRule[Define.FAN_DANDIAO] = false;
  return 1;
}

// **************************************************************************************
//
//78 坎张 和2张牌之间的牌。4556和5也为坎张，手中有45567和6不算坎张
//
// **************************************************************************************
CJudge.prototype.CheckKanZang = function (sHuResult, that) {
  if ((that.m_pCheckParam.nWinMode & Define.WIN_MODE_TIANHU) == Define.WIN_MODE_TIANHU) {
    // 天和不计边坎钓
    return 0;
  }

  // 先搜索到最后摸的那张牌的花色和数字
  let sWinTileInfo = new Define.tagTileInfo();
  if (!that.GetTileInfo(that.m_pCheckParam.asHandStone[0].nID, sHuResult.asGroup, sWinTileInfo)) {
    // 居然没找到
    return 0;
  }

  if (sHuResult.asGroup[sWinTileInfo.nGroupIndex].nGroupStyle != Define.GROUP_STYLE_SHUN
    || sWinTileInfo.nIndex != 1) {
    // 不是顺或者不是顺的第二张
    return 0;
  }

  let nNoWhat1, nNoWhat2;// 不能有这两种顺子
  if (sWinTileInfo.nWhat >= Define.STONE_NO3 && sWinTileInfo.nWhat <= Define.STONE_NO7) {
    nNoWhat1 = sWinTileInfo.nWhat - 2;	// 本张作为顺的最后一张
    nNoWhat2 = sWinTileInfo.nWhat;		// 本张作为顺的第一张
  }
  else if (sWinTileInfo.nWhat == Define.STONE_NO2) {
    nNoWhat1 = nNoWhat2 = Define.STONE_NO2;//只要没有234就行了
  }
  else if (sWinTileInfo.nWhat == Define.STONE_NO8) {
    nNoWhat1 = nNoWhat2 = Define.STONE_NO6;//只要没有678就行了
  }
  else {
    return 0;
  }

  for (let i = sHuResult.cnShowGroups; i < sHuResult.cnGroups - 1; i++) {// 最后一对是将牌
    if (sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_SHUN
      && sHuResult.asGroup[i].asStone[0].nColor == sWinTileInfo.nColor
      && (sHuResult.asGroup[i].asStone[0].nWhat == nNoWhat1
        || sHuResult.asGroup[i].asStone[0].nWhat == nNoWhat2)) {
      // 不能有将本张作为第一张或最后一张的顺
      return 0;
    }
  }

  // 不计边张和单钓将
  that.m_abEnableRule[Define.FAN_BIANZANG] = false;
  that.m_abEnableRule[Define.FAN_DANDIAO] = false;
  return 1;

}

// **************************************************************************************
//
//79 单钓将 钓单张牌作将成和
//
// **************************************************************************************
CJudge.prototype.CheckDanDiao = function (sHuResult, that) {
  if ((that.m_pCheckParam.nWinMode & Define.WIN_MODE_TIANHU) == Define.WIN_MODE_TIANHU) {
    // 天和不计边坎钓
    return 0;
  }


  if (that.m_pCheckParam.asHandStone[0].nID == sHuResult.asGroup[4].asStone[0].nID
    || that.m_pCheckParam.asHandStone[0].nID == sHuResult.asGroup[4].asStone[1].nID) {
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
//80 自摸 自己抓进牌成和牌
//
// **************************************************************************************
CJudge.prototype.CheckZiMo = function (sHuResult, that) {
  return 0;
}

// **************************************************************************************
//
// 以下是大众麻将的番种
//
// **************************************************************************************

// 168番
// **************************************************************************************
//
// 82 四方大发财
// 不计大四喜，小四喜，字一色，门风刻，圈风刻，3风刻，碰碰和，全带幺，混幺九 幺九刻
//
// **************************************************************************************
CJudge.prototype.Check4FangDaFa = function (sHuResult) {
  for (let i = 0; i < 4; i++) {
    if (this.m_sGroupsRelation.acnKeGroups[Define.COLOR_WIND][i] != 1) {
      return 0;
    }
  }
  if (this.m_sStonesRelation.acnAllStones[32] != 2) {
    // 发财两个
    return 0;
  }

  // 屏蔽掉不计的番种
  this.m_abEnableRule[Define.FAN_DA4XI] = false;
  this.m_abEnableRule[Define.FAN_XIAO4XI] = false;
  this.m_abEnableRule[Define.FAN_ZI1SHE] = false;
  this.m_abEnableRule[Define.FAN_QUANFENG] = false;
  this.m_abEnableRule[Define.FAN_MENGFENG] = false;
  this.m_abEnableRule[Define.FAN_3FENGKE] = false;
  this.m_abEnableRule[Define.FAN_PENPENHU] = false;
  this.m_abEnableRule[Define.FAN_HUN19] = false;
  this.m_abEnableRule[Define.FAN_QUANDAIYAO] = false;
  this.m_abEnableRule[Define.FAN_19KE] = false;

  return 1;
}

// 83 天和

// 158番
// 84 地和

// 108番
// 85 人和

// 88番
// **************************************************************************************
//
// 86 混杠
//
// **************************************************************************************
CJudge.prototype.CheckHunGang = function (sHuResult) {
  //	if ( this.m_sOriginalStoneRelation.cnHun == 0
  //		&& this.m_pCheckParam.cnAnGang + this.m_pCheckParam.cnMinGang != 0 )
  if (this.m_pCheckParam.cnAnGang + this.m_pCheckParam.cnMinGang != 0) {
    for (let i = 0; i < this.m_pCheckParam.cnShowGroups; i++) {
      if (this.IsHun(this.m_pCheckParam.asShowGroup[i].asStone[0])) {
        return 1;
      }
    }
  }

  return 0;
}

// **************************************************************************************
//
// 87 八仙过海，手上有八张花牌，不计春夏秋冬，梅兰竹菊
//
// **************************************************************************************
CJudge.prototype.Check8Xian = function (sHuResult) {
  if (this.m_pCheckParam.cnFlower == 8) {
    return 1;
  }
  return 0;
}

// 32番
// **************************************************************************************
//
// 88 七抢一，手上有七张花牌和牌，另一家手上有一张花牌，不计春夏秋冬，梅兰竹菊
//
// **************************************************************************************
CJudge.prototype.Check7Qiang1 = function (sHuResult) {
  return 0;
}

// 89 天听

// 6番
// **************************************************************************************
//
// 90 混四节
// 两种或三种花色牌序数依次交错递增一位的四副刻子
// 不计混三节
//
// **************************************************************************************
CJudge.prototype.CheckHun4Jie = function (sHuResult) {
  let nLastColor = 0xffff;
  let i = 0;
  for (i = 0; i < Define.STONE_NO7; i++) {
    for (let j = 0; j < 3; j++) {
      if (this.m_sGroupsRelation.acnKeGroups[j][i] == 1) {
        nLastColor = j;
        break;
      }
    }
    if (nLastColor != 0xffff) {
      break;
    }
  }
  if (i == Define.STONE_NO7) {
    return 0;
  }

  let anColor = new Array(4);
  for (let j = 0; j < 4; j++) {
    // 从这个刻开始，要有连续的四刻
    anColor[j] = this.m_sGroupsRelation.acnKeGroups[0][i + j]
      + (this.m_sGroupsRelation.acnKeGroups[1][i + j] << 4)
      + (this.m_sGroupsRelation.acnKeGroups[2][i + j] << 8);
    if (anColor[j] == 0) {
      // 这上刻子没有
      return 0;
    }
  }
  let nAll = anColor[0] + anColor[1] + anColor[2] + anColor[3];
  if ((nAll & 0x0f00) == 0 || (nAll & 0x00f0) == 0 || (nAll & 0x000f) == 0) {
    // 三个花色都得有
    return 0;
  }

  /*
   for( let j = i + 1; j < i + 4; j++ )
   {
   for( let k = 0; k < 3; k++ )
   {
   if ( k == nLastColor )
   {
   continue;
   }
   if ( this.m_sGroupsRelation.acnKeGroups[k][j] == 1 )
   {
   nLastColor = k;
   break;
   }
   }
   if ( k == 3 )
   {
   return 0;
   }
   }
   */

  this.m_abEnableRule[Define.FAN_HUN3JIE] = false;

  return 1;
}

// 4番
// **************************************************************************************
//
// 91 混四步
// 两种或三种花色牌序数依次交错递增一位的四副顺子
// 不计混三步
//
// **************************************************************************************
CJudge.prototype.CheckHun4Bu = function (sHuResult) {
  let nLastColor = 0xffff;
  let i = 0;
  for (i = 0; i < Define.STONE_NO5; i++) {
    for (let j = 0; j < 3; j++) {
      if (this.m_sGroupsRelation.acnShunGroups[j][i] == 1) {
        nLastColor = j;
        break;
      }
    }
    if (nLastColor != 0xffff) {
      break;
    }
  }
  if (i == Define.STONE_NO5) {
    return 0;
  }

  let anColor = new Array(4);
  for (let j = 0; j < 4; j++) {
    // 从这个刻开始，要有连续的四顺
    anColor[j] = this.m_sGroupsRelation.acnShunGroups[0][i + j]
      + (this.m_sGroupsRelation.acnShunGroups[1][i + j] << 4)
      + (this.m_sGroupsRelation.acnShunGroups[2][i + j] << 8);
    if (anColor[j] == 0) {
      // 这个顺子没有
      return 0;
    }
  }
  let nAll = anColor[0] + anColor[1] + anColor[2] + anColor[3];
  if ((nAll & 0x0f00) == 0 || (nAll & 0x00f0) == 0 || (nAll & 0x000f) == 0) {
    // 三个花色都得有
    return 0;
  }

  /*
   for( let j = i + 1; j < i + 4; j++ )
   {
   for( let k = 0; k < 3; k++ )
   {
   if ( k == nLastColor )
   {
   continue;
   }
   if ( this.m_sGroupsRelation.acnShunGroups[k][j] == 1 )
   {
   nLastColor = k;
   break;
   }
   }
   if ( k == 3 )
   {
   return 0;
   }
   }
   */

  this.m_abEnableRule[Define.FAN_HUN3BU] = false;

  return 1;
}

// **************************************************************************************
//
// 92 混三节
//
// **************************************************************************************
CJudge.prototype.CheckHun3Jie = function (sHuResult) {
  for (let nFirstWhat = 0; nFirstWhat < Define.STONE_NO8; nFirstWhat++) {
    if (this.m_sGroupsRelation.acnKeGroups[0][nFirstWhat] == 0
      && this.m_sGroupsRelation.acnKeGroups[1][nFirstWhat] == 0
      && this.m_sGroupsRelation.acnKeGroups[2][nFirstWhat] == 0) {
      // 三个花色都没有刻
      continue;
    }

    // 找到一个刻了，看看其后有没有满足要求的刻
    if ((this.m_sGroupsRelation.acnKeGroups[0][nFirstWhat + 1] != 0
      || this.m_sGroupsRelation.acnKeGroups[1][nFirstWhat + 1] != 0
      || this.m_sGroupsRelation.acnKeGroups[2][nFirstWhat + 1] != 0)
      && (this.m_sGroupsRelation.acnKeGroups[0][nFirstWhat + 2] != 0
        || this.m_sGroupsRelation.acnKeGroups[1][nFirstWhat + 2] != 0
        || this.m_sGroupsRelation.acnKeGroups[2][nFirstWhat + 2] != 0)) {
      // 其后至少有两个相连的刻子，初步满足要求，还要看是不是三色三节高和一色三节高
      // 和一色四节高
      if (sHuResult.anFans[Define.FAN_3SHEJIEJIEGAO] == 0
        && sHuResult.anFans[Define.FAN_1SHE3JIEGAO] == 0
        && sHuResult.anFans[Define.FAN_1SHE4JIEGAO] == 0) {
        return 1;
      }
    }
  }

  return 0;
  /*
   let nLastColor;
   for( let i = 0; i < STONE_NO8; i++ )
   {
   for( let j = 0; j < 3; j++ )
   {
   if ( this.m_sGroupsRelation.acnKeGroups[j][i] != 0
   && ( this.m_sGroupsRelation.acnKeGroups[(j + 1) % 3][i + 1] != 0
   || this.m_sGroupsRelation.acnKeGroups[(j + 2) % 3][i + 1] != 0 ) )
   {
   nLastColor = j;
   break;
   }
   }
   if ( j != 3 )
   {
   break;
   }
   }
   if ( i == STONE_NO8 )
   {
   return 0;
   }

   for( let j = i + 1; j < i + 3; j++ )
   {
   for( let k = 0; k < 3; k++ )
   {
   if ( k == nLastColor )
   {
   continue;
   }
   if ( this.m_sGroupsRelation.acnKeGroups[k][j] != 0 )
   {
   nLastColor = k;
   break;
   }
   }
   if ( k == 3 )
   {
   return 0;
   }
   }

   return 1;
   */
}

// 2番
// **************************************************************************************
//
// 93 无混
//
// **************************************************************************************
CJudge.prototype.CheckWuHun = function (sHuResult) {
  //	if ( this.m_sOriginalStoneRelation.cnHun == 0 )
  //	{
  //		return 1;
  //	}
  //	return 0;
  for (let i = 0; i < this.m_pCheckParam.cnHandStone; i++) {
    if (this.IsHun(this.m_pCheckParam.asHandStone[i])) {
      return 0;
    }
  }

  return 1;
}

// **************************************************************************************
//
// 94 混龙
// 2种花色的3副顺子连接成1-9的序数牌
//
// **************************************************************************************
CJudge.prototype.CheckHunLong = function (sHuResult) {
  if (this.m_sGroupsRelation.acnShunGroups[0][0] + this.m_sGroupsRelation.acnShunGroups[1][0]
    + this.m_sGroupsRelation.acnShunGroups[2][0] != 0
    && this.m_sGroupsRelation.acnShunGroups[0][3] + this.m_sGroupsRelation.acnShunGroups[1][3]
    + this.m_sGroupsRelation.acnShunGroups[2][3] != 0
    && this.m_sGroupsRelation.acnShunGroups[0][6] + this.m_sGroupsRelation.acnShunGroups[1][6]
    + this.m_sGroupsRelation.acnShunGroups[2][6] != 0) {
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
// 95 混三步
//
// **************************************************************************************
CJudge.prototype.CheckHun3Bu = function (sHuResult) {
  for (let nFirstWhat = 0; nFirstWhat < Define.STONE_NO6; nFirstWhat++) {
    if (this.m_sGroupsRelation.acnShunGroups[0][nFirstWhat] == 0
      && this.m_sGroupsRelation.acnShunGroups[1][nFirstWhat] == 0
      && this.m_sGroupsRelation.acnShunGroups[2][nFirstWhat] == 0) {
      // 三个花色都没有顺
      continue;
    }

    // 找到一个顺了，看看其后有没有满足要求的顺
    if ((this.m_sGroupsRelation.acnShunGroups[0][nFirstWhat + 1] != 0
      || this.m_sGroupsRelation.acnShunGroups[1][nFirstWhat + 1] != 0
      || this.m_sGroupsRelation.acnShunGroups[2][nFirstWhat + 1] != 0)
      && (this.m_sGroupsRelation.acnShunGroups[0][nFirstWhat + 2] != 0
        || this.m_sGroupsRelation.acnShunGroups[1][nFirstWhat + 2] != 0
        || this.m_sGroupsRelation.acnShunGroups[2][nFirstWhat + 2] != 0)) {
      // 其后至少有两个相连的顺子，初步满足要求，还要看是不是三色三步高和一色三步高
      if (sHuResult.anFans[Define.FAN_3SHE3BUGAO] == 0
        && sHuResult.anFans[Define.FAN_1SHE3BUGAO] == 0) {
        return 1;
      }
    }
  }

  return 0;

  /*
   let nLastColor;
   for( let i = 0; i < STONE_NO6; i++ )
   {
   for( let j = 0; j < 3; j++ )
   {
   if ( this.m_sGroupsRelation.acnShunGroups[j][i] != 0
   && ( this.m_sGroupsRelation.acnShunGroups[(j + 1) % 3][i + 1] != 0
   || this.m_sGroupsRelation.acnShunGroups[(j + 2) % 3][i + 1] != 0 ) )
   {
   nLastColor = j;
   break;
   }
   }
   if ( j != 3 )
   {
   break;
   }
   }
   if ( i == STONE_NO6 )
   {
   return 0;
   }

   for( let j = i + 1; j < i + 3; j++ )
   {
   for( let k = 0; k < 3; k++ )
   {
   if ( k == nLastColor )
   {
   continue;
   }
   if ( this.m_sGroupsRelation.acnShunGroups[k][j] != 0 )
   {
   nLastColor = k;
   break;
   }
   }
   if ( k == 3 )
   {
   return 0;
   }
   }

   return 1;
   */
}

// **************************************************************************************
//
// 96 立直
//
// **************************************************************************************
CJudge.prototype.CheckLiZhi = function (sHuResult) {
  if (this.m_pCheckParam.nWinMode & Define.WIN_MODE_LIZHI
    && this.m_pCheckParam.cnShowGroups == 0) {
    return 1;
  }
  return 0;
}

// 1番
// **************************************************************************************
//
// 97 二五八将
//
// **************************************************************************************
CJudge.prototype.Check258Jong = function (sHuResult) {

  if (sHuResult.asGroup[4].asStone[0].nColor < 3
    && (sHuResult.asGroup[4].asStone[0].nWhat == Define.STONE_NO2
      || sHuResult.asGroup[4].asStone[0].nWhat == Define.STONE_NO5
      || sHuResult.asGroup[4].asStone[0].nWhat == Define.STONE_NO8)) {
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
// 98 梅兰竹菊，集齐这四张花牌之后额外加分
//
// **************************************************************************************
CJudge.prototype.Check4Flower = function (sHuResult) {
  //	if ( this.m_pCheckParam.pFlower == NULL )
  //	{
  //		return 0;
  //	}

  let cnFlower = 0;
  for (let i = 0; i < this.m_pCheckParam.cnFlower; i++) {
    if (this.m_pCheckParam.asFlower[i].nColor == Define.COLOR_FLOWER) {
      cnFlower++;
    }
  }
  if (cnFlower == 4) {
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
// 99 春夏秋冬，集齐这四张花牌之后额外加分
//
// **************************************************************************************
CJudge.prototype.Check4Season = function (sHuResult) {
  //	if ( this.m_pCheckParam.pFlower == NULL )
  //	{
  //		return 0;
  //	}

  let cnSeason = 0;
  for (let i = 0; i < this.m_pCheckParam.cnFlower; i++) {
    if (this.m_pCheckParam.asFlower[i].nColor == Define.COLOR_SEASON) {
      cnSeason++;
    }
  }
  if (cnSeason == 4) {
    return 1;
  }

  return 0;
}

// **************************************************************************************
//
// 100 季花
//
// **************************************************************************************
CJudge.prototype.CheckSeasonFlower = function (sHuResult) {
  let cnSeasonFlower = 0;
  for (let i = 0; i < this.m_pCheckParam.cnFlower; i++) {
    if (this.m_pCheckParam.asFlower[i].nWhat == ((this.m_pCheckParam.nMenWind & 0x00f0) >> 4)) {
      cnSeasonFlower++;
    }
  }

  return cnSeasonFlower;
}

// **************************************************************************************
//
// 101 么九头 由序数牌的19做将牌
//
// **************************************************************************************
CJudge.prototype.Check19Jong = function (sHuResult) {

  if (sHuResult.asGroup[4].asStone[0].nColor < 3
    && (sHuResult.asGroup[4].asStone[0].nWhat == Define.STONE_NO1
      || sHuResult.asGroup[4].asStone[0].nWhat == Define.STONE_NO9)) {
    return 1;
  }

  return 0;
}


// **************************************************************************************
//
// 取番种信息
//
// **************************************************************************************
CJudge.prototype.GetFanInfo = function (nFanID, szFanName, szFanScore) {
  if (nFanID < 0 || nFanID > 100) {
    return false;
  }

  // 所有番种的名字，这个顺序是和nFanID相对应的

  szFanName = stc_pszFanName[nFanID];
  szFanScore = this.m_asFanInfo[nFanID].nScore.toString() + "番";
  return true;
}

// **************************************************************************************
//
// 吃碰杠检验
//
// **************************************************************************************
CJudge.prototype.CheckShowTile = function (sCheckParam, nCheckMask, asShowGroup) {
  let cnShowGroup = 0;
  if (nCheckMask & Define.REQUEST_TYPE_CHI) {
    cnShowGroup += this.CheckChi(sCheckParam, asShowGroup);
  }

  if (nCheckMask & Define.REQUEST_TYPE_PENG) {
    cnShowGroup += this.CheckPeng(sCheckParam, asShowGroup);
  }

  if (nCheckMask & Define.REQUEST_TYPE_GANG) {
    cnShowGroup += this.CheckGang(sCheckParam, asShowGroup);
  }

  return cnShowGroup;
}

// **************************************************************************************
//
// 是否能吃
//
// **************************************************************************************
CJudge.prototype.CheckChi = function (sCheckParam, asShowGroup) {
  if (this.IsHun(sCheckParam.asHandStone[0]) || sCheckParam.asHandStone[0].nColor == Define.COLOR_WIND
    || sCheckParam.asHandStone[0].nColor == Define.COLOR_JIAN) {
    // 对混牌既不能吃不也不能碰
    return 0;
  }

  let cnEatGroup = 0;
  let anRelateIndex = [-1, -1, 0, -1, -1];	// 跟第一张牌相关联的牌的索引
  let i = 1;
  for (i = 1; i < sCheckParam.cnHandStone; i++) {
    if (sCheckParam.asHandStone[i].nColor != sCheckParam.asHandStone[0].nColor
      || this.IsHun(sCheckParam.asHandStone[i]))// 混牌不能参与吃牌
    {
      continue;
    }
    let nMinus = sCheckParam.asHandStone[i].nWhat - sCheckParam.asHandStone[0].nWhat;
    if (nMinus <= 2 && nMinus >= -2 && nMinus != 0 && anRelateIndex[nMinus + 2] == -1) {
      anRelateIndex[nMinus + 2] = i;
    }
  }
  for (i = 0; i <= 2; i++) {
    if (anRelateIndex[i] != -1 && anRelateIndex[i + 1] != -1 && anRelateIndex[i + 2] != -1) {
      asShowGroup[cnEatGroup].nGroupStyle = Define.GROUP_STYLE_SHUN;
      asShowGroup[cnEatGroup].asStone[0] = _.cloneDeep(sCheckParam.asHandStone[anRelateIndex[i]]);
      asShowGroup[cnEatGroup].asStone[1] = _.cloneDeep(sCheckParam.asHandStone[anRelateIndex[i + 1]]);
      asShowGroup[cnEatGroup].asStone[2] = _.cloneDeep(sCheckParam.asHandStone[anRelateIndex[i + 2]]);
      cnEatGroup++;
    }
  }

  return cnEatGroup;
}

// **************************************************************************************
//
// 是否能碰
//
// **************************************************************************************
CJudge.prototype.CheckPeng = function (sCheckParam, asShowGroup) {
  if (this.IsHun(sCheckParam.asHandStone[0])) {
    // 对混牌既不能吃不也不能碰
    return 0;
  }

  let cnSameStone = 1;
  for (let i = 1; i < sCheckParam.cnHandStone; i++) {
    //		if ( StoneValue( sCheckParam.asHandStone[i] ) == StoneValue( sCheckParam.asHandStone[0] ) )
    if (this.IsSameStone(sCheckParam.asHandStone[i], sCheckParam.asHandStone[0])) {

      cnSameStone++;
      if (cnSameStone >= 3) {
        asShowGroup[3].nGroupStyle = Define.GROUP_STYLE_KE;
        asShowGroup[3].asStone[0] = _.cloneDeep(sCheckParam.asHandStone[0]);
        asShowGroup[3].asStone[1] = _.cloneDeep(sCheckParam.asHandStone[0]);
        asShowGroup[3].asStone[2] = _.cloneDeep(sCheckParam.asHandStone[0]);
        return 1;
      }
    }
  }

  return 0;
}

// **************************************************************************************
//
// 是否能杠,必须在sCheckParam的nWinMode中设置是否自摸的牌
//
// **************************************************************************************
CJudge.prototype.CheckGang = function (sCheckParam, asShowGroup) {
  if (this.IsHun(sCheckParam.asHandStone[0]) && !(sCheckParam.nWinMode & Define.WIN_MODE_ZIMO)) {
    // 对混牌除非是自已摸的，否则不能杠
    return 0;
  }

  let cnCheck = 1;			// 检查几张牌
  let cnGang = 0;
  if (sCheckParam.nWinMode & Define.WIN_MODE_ZIMO) {
    // 如果是自已抓牌后的请求杠牌,每张牌都要看看能不能杠
    cnCheck = sCheckParam.cnHandStone;
  }
  for (let nCheckIndex = 0; nCheckIndex < cnCheck; nCheckIndex++) {
    let cnSameStone = 1;
    // 手中牌
    let i = 0;
    for (i = nCheckIndex + 1; i < sCheckParam.cnHandStone; i++) {
      if (this.IsSameStone(sCheckParam.asHandStone[i], sCheckParam.asHandStone[nCheckIndex])) {
        cnSameStone++;
        if (cnSameStone == 4) {
          asShowGroup[cnGang].nGroupStyle = Define.GROUP_STYLE_MINGGANG;
          if (sCheckParam.nWinMode & Define.WIN_MODE_ZIMO) {
            // 自已摸的牌成杠，暗杠
            asShowGroup[cnGang].nGroupStyle = Define.GROUP_STYLE_ANGANG;
          }

          asShowGroup[4].asStone[0] = _.cloneDeep(sCheckParam.asHandStone[nCheckIndex]);
          asShowGroup[4].asStone[1] = _.cloneDeep(sCheckParam.asHandStone[nCheckIndex]);
          asShowGroup[4].asStone[2] = _.cloneDeep(sCheckParam.asHandStone[nCheckIndex]);
          asShowGroup[4].asStone[3] = _.cloneDeep(sCheckParam.asHandStone[nCheckIndex]);
          cnGang++;
          return cnGang;
        }
      }
    }

    // 如果是自已摸的牌，还要看看碰的牌
    if (sCheckParam.nWinMode & Define.WIN_MODE_ZIMO) {
      // 碰的牌
      for (i = 0; i < sCheckParam.cnShowGroups; i++) {
        if (sCheckParam.asShowGroup[i].nGroupStyle != Define.GROUP_STYLE_KE
          || !this.IsSameStone(sCheckParam.asShowGroup[i].asStone[0], sCheckParam.asHandStone[nCheckIndex])) {
          continue;
        }
        // 肯定可以杠
        asShowGroup[4].nGroupStyle = Define.GROUP_STYLE_MINGGANG;
        asShowGroup[4].asStone[0] = _.cloneDeep(sCheckParam.asHandStone[nCheckIndex]);
        Define._memcpy(asShowGroup[4].asStone, 1, sCheckParam.asShowGroup[i].asStone, 0, 3);
        cnGang++;
        break;
      }
    }
  }

  return cnGang;
}

// **************************************************************************************
//
// 分析番种，取得番种详细信息
//
// **************************************************************************************
CJudge.prototype.ParseFans = function (sWinInfo, vsFanInfo) {
  this.GetGroupsInfo(sWinInfo, this.m_sGroupsRelation, this.m_sStonesRelation);

  for (let i = 0; i < Define.MAXFANS; i++) {
    if (sWinInfo.anFans[i] > 0) {
      this.m_asFanInfo[i].fParse(sWinInfo, vsFanInfo);
    }
  }
}



// **************************************************************************************
//
//88番
//1 大四喜 由4副风刻(杠)组成的和牌。不计圈风刻、门风刻、三风刻、碰碰和、小四喜
//
// **************************************************************************************
CJudge.prototype.ParseDa4Xi = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_DA4XI;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_DA4XI].nScore;
  for (let i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].nGroupStyle != Define.GROUP_STYLE_JONG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[i], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//2 大三元 和牌中，有中发白3副刻子。不计箭刻
//
// **************************************************************************************
CJudge.prototype.ParseDa3Yuan = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_DA3YUAN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_DA3YUAN].nScore;
  for (let i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].asStone[0].nColor == Define.COLOR_JIAN) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[i], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//3 绿一色 由23468条及发字中的任何牌组成的顺子、刻子、将的和牌。不计混一色。如无“发”字组成的各牌，可计清一色
//
// **************************************************************************************
CJudge.prototype.ParseLv1She = function (sHuResult, vsFanInfo) {

  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_LVYISHE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_LVYISHE].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//4 九莲宝灯 由一种花色序数牌子按1112345678999组成的特定牌型，见同花色任何1张序数牌即成和牌。不计清一色
//
// **************************************************************************************
CJudge.prototype.Parse9LianBaoDeng = function (sHuResult, vsFanInfo) {

  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_9LIANBAODEN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_9LIANBAODEN].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//5 四杠 4个杠
//
// **************************************************************************************
CJudge.prototype.Parse4Gang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_4GANG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_4GANG].nScore;
  for (let i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_MINGGANG
      || sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_ANGANG) {
      sFanInfo.anTileID[sFanInfo.cnTile] = sHuResult.asGroup[i].asStone[0].nID;
      sFanInfo.anTileID[sFanInfo.cnTile + 1] = sHuResult.asGroup[i].asStone[1].nID;
      sFanInfo.anTileID[sFanInfo.cnTile + 2] = sHuResult.asGroup[i].asStone[2].nID;
      sFanInfo.anTileID[sFanInfo.cnTile + 3] = sHuResult.asGroup[i].asStone[3].nID;
    }
    sFanInfo.cnTile += 4;
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//6 连七对 由一种花色序数牌组成序数相连的7个对子的和牌。不计清一色、不求人、单钓
//
// **************************************************************************************
CJudge.prototype.ParseLian7Dui = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_LIAN7DUI;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_LIAN7DUI].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//7 十三幺 由3种序数牌的一、九牌，7种字牌及其中一对作将组成的和牌。不计五门齐、不求人、单钓
//
// **************************************************************************************
CJudge.prototype.Parse13Yao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_131;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_131].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//
//64番
//8 清幺九 由序数牌一、九刻子组成的和牌。不计碰碰和、同刻、元字
//
// **************************************************************************************
CJudge.prototype.ParseQing19 = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QING19;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QING19].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//9 小四喜 和牌时有风牌的3副刻子及将牌。不计三风刻
//
// **************************************************************************************
CJudge.prototype.ParseXiao4Xi = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_XIAO4XI;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_XIAO4XI].nScore;
  for (let i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].asStone[0].nColor == Define.COLOR_WIND) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[i], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//10 小三元 和牌时有箭牌的两副刻子及将牌。不计箭刻
//
// **************************************************************************************
CJudge.prototype.ParseXiao3Yuan = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_XIAO3YUAN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_XIAO3YUAN].nScore;
  for (let i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].asStone[0].nColor != Define.COLOR_JIAN) {
      continue;
    }
    sFanInfo.cnTile += this.GetID(sHuResult.asGroup[i], sFanInfo.anTileID, sFanInfo.cnTile);
  }
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//11 字一色 由字牌的刻子(杠)、将组成的和牌。不计碰碰和
//
// **************************************************************************************
CJudge.prototype.ParseZi1She = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_ZI1SHE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_ZI1SHE].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//12 四暗刻 4个暗刻(暗杠)。不计门前清、碰碰和
//
// **************************************************************************************
CJudge.prototype.Parse4AnKe = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_4ANKE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_4ANKE].nScore;
  for (let i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_KE
      || sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_MINGGANG
      || sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_ANGANG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[i], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//13 一色双龙会 一种花色的两个老少副，5为将牌。不计平和、七对、清一色
//
// **************************************************************************************
CJudge.prototype.Parse1She2Long = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_1SHE2GLONG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_1SHE2GLONG].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//
//48番
//14 一色四同顺 一种花色4副序数相同的顺子，不计一色三节高、一般高、四归一
//
// **************************************************************************************
CJudge.prototype.Parse1She4TongShun = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_1SHE4TONGSHUN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_1SHE4TONGSHUN].nScore;
  for (let i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].nGroupStyle != Define.GROUP_STYLE_JONG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[i], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//15 一色四节高 一种花色4副依次递增一位数的刻子不计一色三同顺、碰碰和
//
// **************************************************************************************
CJudge.prototype.Parse1She4JieGao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_1SHE4JIEGAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_1SHE4JIEGAO].nScore;
  for (let i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].nGroupStyle != Define.GROUP_STYLE_JONG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[i], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//
//32番
//16 一色四步高 一种花色4副依次递增一位数或依次递增二位数的顺子
//
// **************************************************************************************
CJudge.prototype.Parse1She4BuGao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_1SHE4BUGAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_1SHE4BUGAO].nScore;
  for (let i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].nGroupStyle != Define.GROUP_STYLE_JONG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[i], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//17 三杠 3个杠
//
// **************************************************************************************
CJudge.prototype.Parse3Gang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_3GANG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_3GANG].nScore;
  for (let i = 0; i < sHuResult.cnGroups; i++) {
    if (sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_MINGGANG
      || sHuResult.asGroup[i].nGroupStyle == Define.GROUP_STYLE_ANGANG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[i], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//18 混幺九 由字牌和序数牌一、九的刻子用将牌组成的各牌。不计碰碰和
//
// **************************************************************************************
CJudge.prototype.ParseHun19 = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HUN19;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HUN19].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//
//24番
//19 七对 由7个对子组成和牌。不计不求人、单钓
//
// **************************************************************************************
CJudge.prototype.Parse7Dui = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_7DUI;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_7DUI].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//20 七星不靠 必须有7个单张的东西南北中发白，加上3种花色，数位按147、258、369中的7张序数牌组成没有将牌的和牌。不计五门齐、不求人、单钓
//
// **************************************************************************************
CJudge.prototype.Parse7XinBuKao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_7XINBUKAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_7XINBUKAO].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//21 全双刻 由2、4、6、8序数牌的刻子、将牌组成的和牌。不计碰碰和、断幺
//
// **************************************************************************************
CJudge.prototype.ParseQuan2Ke = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QUANSHUANGKE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QUANSHUANGKE].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//22 清一色 由一种花色的序数牌组成和牌。不无字
//
// **************************************************************************************
CJudge.prototype.ParseQing1She = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QING1SHE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QING1SHE].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//23 一色三同顺 和牌时有一种花色3副序数相同的顺子。不计一色三节高
//
// **************************************************************************************
CJudge.prototype.Parse1She3TongShun = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_1SHE3TONGSHUN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_1SHE3TONGSHUN].nScore;

  // 花色
  let i = 0;
  for (i = 0; i < 3; i++) {
    if (this.m_sStonesRelation.acnAllColors[i] >= 9) {
      break;
    }
  }
  // 点数
  let j = 0;
  for (j = 0; j < 7; j++) {
    if (this.m_sGroupsRelation.acnShunGroups[i][j] == 3) {
      break;
    }
  }
  for (let k = 0; k < sHuResult.cnGroups; k++) {
    if (sHuResult.asGroup[k].nGroupStyle == Define.GROUP_STYLE_SHUN
      && sHuResult.asGroup[k].asStone[0].nColor == i
      && sHuResult.asGroup[k].asStone[0].nWhat == j) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[k], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//24 一色三节高 和牌时有一种花色3副依次递增一位数字的刻子。不计一色三同顺
//
// **************************************************************************************
CJudge.prototype.Parse1She3JieGao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_1SHE3JIEGAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_1SHE3JIEGAO].nScore;

  // 花色
  let i = 0;
  for (i = 0; i < 3; i++) {
    if (this.m_sStonesRelation.acnAllColors[i] >= 9) {
      break;
    }
  }
  // 点数
  let j = 0;
  for (j = 0; j < Define.STONE_NO8; j++) {
    if (this.m_sGroupsRelation.acnKeGroups[i][j] != 0
      && this.m_sGroupsRelation.acnKeGroups[i][j + 1] != 0
      && this.m_sGroupsRelation.acnKeGroups[i][j + 2] != 0) {
      break;
    }
  }

  for (let k = 0; k < sHuResult.cnGroups; k++) {
    if (this.IsKe(sHuResult.asGroup[k]) && sHuResult.asGroup[k].asStone[0].nColor == i
      && sHuResult.asGroup[k].asStone[0].nWhat >= j && sHuResult.asGroup[k].asStone[0].nWhat <= j + 2) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[k], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//25 全大 由序数牌789组成的顺子、刻子(杠)、将牌的和牌。不计无字
//
// **************************************************************************************
CJudge.prototype.ParseQuanDa = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QUANDA;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QUANDA].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//26 全中 由序数牌456组成的顺子、刻子(杠)、将牌的和牌。不计断幺
//
// **************************************************************************************
CJudge.prototype.ParseQuanZhong = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QUANZHONG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QUANZHONG].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//27 全小 由序数牌123组成的顺子、刻子(杠)将牌的的和牌。不计无字
//
// **************************************************************************************
CJudge.prototype.ParseQuanXiao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QUANXIAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QUANXIAO].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//
//16番
//28 清龙 和牌时，有一种花色1-9相连接的序数牌
//
// **************************************************************************************
CJudge.prototype.ParseQingLong = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QINGLONG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QINGLONG].nScore;

  let i = 0;
  for (i = 0; i < 3; i++) {
    if (this.m_sStonesRelation.acnAllColors[i] >= 9) {
      break;
    }
  }
  let abFound = [false, false, false];
  for (let j = 0; j < sHuResult.cnGroups; j++) {
    if (sHuResult.asGroup[j].nGroupStyle == Define.GROUP_STYLE_SHUN
      && sHuResult.asGroup[j].asStone[0].nColor == i) {
      let nIndex = Math.floor(sHuResult.asGroup[j].asStone[0].nWhat / 3);
      let nMod = sHuResult.asGroup[j].asStone[0].nWhat % 3;
      if (nMod == 0 && !abFound[nIndex]) {
        abFound[nIndex] = true;
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[j], sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//29 三色双龙会 2种花色2个老少副、另一种花色5作将的和牌。不计喜相逢、老少副、无字、平和
//
// **************************************************************************************
CJudge.prototype.Parse3She2Long = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_3SHE2LONG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_3SHE2LONG].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//30 一色三步高 和牌时，有一种花色3副依次递增一位或依次递增二位数字的顺子
//
// **************************************************************************************
CJudge.prototype.Parse1She3BuGao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_1SHE3BUGAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_1SHE3BUGAO].nScore;

  // 花色
  let i = 0;
  for (i = 0; i < 3; i++) {
    if (this.m_sStonesRelation.acnAllColors[i] >= 9) {
      break;
    }
  }
  // 点数
  let anWhat = [0, 0, 0];
  let j = 0;
  for (j = 0; j < Define.STONE_NO6; j++) {
    // 第一个顺最大只能是567
    if (this.m_sGroupsRelation.acnShunGroups[i][j] == 0) {
      continue;
    }

    if (this.m_sGroupsRelation.acnShunGroups[i][j + 1] != 0
      && this.m_sGroupsRelation.acnShunGroups[i][j + 2] != 0) {
      // 步进一成功
      anWhat[0] = j;
      anWhat[1] = j + 1;
      anWhat[2] = j + 2;
      break;
    }

    if (j < Define.STONE_NO4) {
      // 如果第一顺小于456看看步进2有没有满足要求的顺
      if (this.m_sGroupsRelation.acnShunGroups[i][j + 2] != 0
        && this.m_sGroupsRelation.acnShunGroups[i][j + 4] != 0) {
        anWhat[0] = j;
        anWhat[1] = j + 2;
        anWhat[2] = j + 4;
        break;
      }
    }
  }

  let abFound = [false, false, false];
  for (let k = 0; k < sHuResult.cnGroups; k++) {
    if (sHuResult.asGroup[k].nGroupStyle == Define.GROUP_STYLE_SHUN
      && sHuResult.asGroup[k].asStone[0].nColor == i) {
      for (let m = 0; m < 3; m++) {
        if (sHuResult.asGroup[k].asStone[0].nWhat == anWhat[m] && !abFound[m]) {
          abFound[m] = true;
          sFanInfo.cnTile += this.GetID(sHuResult.asGroup[k], sFanInfo.anTileID, sFanInfo.cnTile);
        }
      }
    }
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//31 全带五 每副牌及将牌必须有5的序数牌。不计断幺
//
// **************************************************************************************
CJudge.prototype.ParseQuanDai5 = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QUANDAI5;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QUANDAI5].nScore;
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//32 三同刻 3个序数相同的刻子(杠)
//
// **************************************************************************************
CJudge.prototype.Parse3TongKe = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_3TONGKE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_3TONGKE].nScore;

  let nWhat = 0;
  for (nWhat = 0; nWhat <= Define.STONE_NO9; nWhat++) {
    if (this.m_sGroupsRelation.acnKeGroups[Define.COLOR_WAN][nWhat] != 0
      && this.m_sGroupsRelation.acnKeGroups[Define.COLOR_BING][nWhat] != 0
      && this.m_sGroupsRelation.acnKeGroups[Define.COLOR_TIAO][nWhat] != 0) {
      break;
    }
  }

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (this.IsKe(sHuResult.asGroup[nGroupIndex])
      && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == nWhat) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//33 三暗刻 3个暗刻
//
// **************************************************************************************
CJudge.prototype.Parse3AnKe = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_3ANKE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_3ANKE].nScore;

  // 分组的排列顺序是吃碰杠的牌在前，将牌在最后
  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (nGroupIndex < sHuResult.cnShowGroups) {
      // 在吃碰杠的分组里只找暗杠
      if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_ANGANG) {
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex], sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }
    else if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_KE) {
      // 如果不是自摸的，除了和的张牌所在的刻，其余的刻都拷进去
      if ((sHuResult.nWinMode & Define.WIN_MODE_ZIMO) == 0
        && (sHuResult.asGroup[nGroupIndex].asStone[0].nID == sHuResult.nHuTileID
          || sHuResult.asGroup[nGroupIndex].asStone[1].nID == sHuResult.nHuTileID
          || sHuResult.asGroup[nGroupIndex].asStone[2].nID == sHuResult.nHuTileID)) {
        continue;
      }
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//
//12番
//34 全不靠 由单张3种花色147、258、369不能错位的序数牌及东南西北中发白中的任何14张牌组成的和牌。不计五门齐、不求人、单钓
//
// **************************************************************************************
CJudge.prototype.ParseQuanBuKao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QUANBUKAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QUANBUKAO].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//35 组合龙 3种花色的147、258、369不能错位的序数牌
//
// **************************************************************************************
CJudge.prototype.ParseZhuHeLong = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_ZHUHELONG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_ZHUHELONG].nScore;

  // 和组合龙有两种可能的和法，一是和全不靠之组合龙，二是和组合龙和法
  if (sHuResult.nResultant == Define.QUANBUKAO) {
    // 全不靠和牌，没有分组
    for (let nTileIndx = 0; nTileIndx < this.m_cnMaxHandStone; nTileIndx++) {
      if (sHuResult.asHandStone[nTileIndx].nColor != Define.COLOR_WIND
        && sHuResult.asHandStone[nTileIndx].nColor != Define.COLOR_JIAN) {
        sFanInfo.anTileID[sFanInfo.cnTile] = sHuResult.asHandStone[nTileIndx].nID;
        sFanInfo.cnTile++;
      }
    }
  }
  else {
    // 组合龙和法
    for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
      if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_LONG) {
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex], sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//36 大于五 由序数牌6-9的顺子、刻子、将牌组成的和牌。不计无字
//
// **************************************************************************************
CJudge.prototype.ParseDaYu5 = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_DAYU5;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_DAYU5].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//37 小于五 由序数牌1-4的顺子、刻子、将牌组成的和牌。不计无字
//
// **************************************************************************************
CJudge.prototype.ParseXiaoYu5 = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_XIAOYU5;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_XIAOYU5].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//38 三风刻 3个风刻
//
// **************************************************************************************
CJudge.prototype.Parse3FengKe = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_3FENGKE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_3FENGKE].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if ((sHuResult.asGroup[nGroupIndex].asStone[0].nColor == Define.COLOR_WIND
      || sHuResult.asGroup[nGroupIndex].asStone[0].nColor == Define.COLOR_JIAN)
      && this.IsKe(sHuResult.asGroup[nGroupIndex])) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//
//8 番
//39 花龙 3种花色的3副顺子连接成1-9的序数牌
//
// **************************************************************************************
CJudge.prototype.ParseHuaLong = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HUALONG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HUALONG].nScore;

  let anColor = [0, 0, 0];
  let anWhat = [0, 0, 0];
  let abFound = [false, false, false];
  for (anColor[0] = 0; anColor[0] < 3; anColor[0]++) {
    if (this.m_sGroupsRelation.acnShunGroups[anColor[0]][Define.STONE_NO1] != 0) {
      // 本花色有123，看看其它两个花色有没有456和789
      anColor[1] = (anColor[0] + 1) % 3;
      anColor[2] = (anColor[0] + 2) % 3;
      if (this.m_sGroupsRelation.acnShunGroups[anColor[1]][Define.STONE_NO4] != 0
        && this.m_sGroupsRelation.acnShunGroups[anColor[2]][Define.STONE_NO7] != 0) {
        anWhat[1] = Define.STONE_NO4;
        anWhat[2] = Define.STONE_NO7;
        break;
      }
      else if (this.m_sGroupsRelation.acnShunGroups[anColor[2]][Define.STONE_NO4] != 0
        && this.m_sGroupsRelation.acnShunGroups[anColor[1]][Define.STONE_NO7] != 0) {
        anWhat[1] = Define.STONE_NO7;
        anWhat[2] = Define.STONE_NO4;
        break;
      }
    }
  }

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_SHUN) {
      for (let i = 0; i < 3; i++) {
        if (sHuResult.asGroup[nGroupIndex].asStone[0].nColor == anColor[i]
          && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == anWhat[i] && !abFound[i]) {
          abFound[i] = true;
          sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex], sFanInfo.anTileID, sFanInfo.cnTile);
        }
      }
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//40 推不倒 由牌面图形没有上下区别的牌组成的和牌，包括1234589饼、245689条、白板。不计缺一门
//
// **************************************************************************************
CJudge.prototype.ParseTuiBuDao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_TUIBUDAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_TUIBUDAO].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//41 三色三同顺 和牌时，有3种花色3副序数相同的顺子
//
// **************************************************************************************
CJudge.prototype.Parse3She3TongShun = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_3SHE3TONGSHUN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_3SHE3TONGSHUN].nScore;

  let nWhat = 0;
  for (nWhat = 0; nWhat < 7; nWhat++) {
    if (this.m_sGroupsRelation.acnShunGroups[Define.COLOR_WAN][nWhat] != 0
      && this.m_sGroupsRelation.acnShunGroups[Define.COLOR_TIAO][nWhat] != 0
      && this.m_sGroupsRelation.acnShunGroups[Define.COLOR_BING][nWhat] != 0) {
      break;
    }
  }
  let abFound = [false, false, false];
  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_SHUN) {
      let nColor = sHuResult.asGroup[nGroupIndex].asStone[0].nColor;
      if (!abFound[nColor] && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == nWhat) {
        abFound[nColor] = true;
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex], sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//42 三色三节高 和牌时，有3种花色3副依次递增一位数的刻子
//
// **************************************************************************************
CJudge.prototype.Parse3She3JieGao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_3SHEJIEJIEGAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_3SHEJIEJIEGAO].nScore;

  let anColor = [0, 0, 0];
  let anWhat = [0, 0, 0];
  // 找出只有一个刻子的花色
  for (anColor[0] = 0; anColor[0] < 3; anColor[0]++) {
    if (this.m_sStonesRelation.acnAllColors[anColor[0]] == 3 || this.m_sStonesRelation.acnAllColors[anColor[0]] == 4) {
      // 要找的就是它
      break;
    }
  }

  // 找出这个刻子
  for (anWhat[0] = 0; anWhat[0] <= Define.STONE_NO9; anWhat[0]++) {
    if (this.m_sGroupsRelation.acnKeGroups[anColor[0]][anWhat[0]] != 0) {
      break;
    }
  }

  // 另外两个花色
  anColor[1] = (anColor[0] + 1) % 3;
  anColor[2] = (anColor[0] + 2) % 3;

  // 共6种组合方式(数字表示刚找到的那个刻)
  // 1二三
  // 1三二
  // 一2三
  // 三2一
  // 一二3
  // 二一3
  let anTryWhat = [[0, 0], [0, 0], [0, 0]];
  anTryWhat[0][0] = anWhat[0] + 2 <= Define.STONE_NO9 ? anWhat[0] + 1 : 0xff;
  anTryWhat[0][1] = anWhat[0] + 2 <= Define.STONE_NO9 ? anWhat[0] + 2 : 0xff;
  anTryWhat[1][0] = (anWhat[0] - 1 >= Define.STONE_NO1 && anWhat[0] + 1 <= Define.STONE_NO9) ? anWhat[0] - 1 : 0xff;
  anTryWhat[1][1] = (anWhat[0] - 1 >= Define.STONE_NO1 && anWhat[0] + 1 <= Define.STONE_NO9) ? anWhat[0] + 1 : 0xff;
  anTryWhat[2][0] = anWhat[0] - 2 >= Define.STONE_NO1 ? anWhat[0] - 2 : 0xff;
  anTryWhat[2][1] = anWhat[0] - 2 >= Define.STONE_NO1 ? anWhat[0] - 1 : 0xff;

  let i = 0;
  for (i = 0; i < 3; i++) {
    if (anTryWhat[i][0] != 0xff) {
      if (this.m_sGroupsRelation.acnKeGroups[anColor[1]][anTryWhat[i][0]] != 0
        && this.m_sGroupsRelation.acnKeGroups[anColor[2]][anTryWhat[i][1]] != 0) {
        anWhat[1] = anTryWhat[i][0];
        anWhat[2] = anTryWhat[i][1];
        break;
      }
      else if (this.m_sGroupsRelation.acnKeGroups[anColor[2]][anTryWhat[i][0]] != 0
        && this.m_sGroupsRelation.acnKeGroups[anColor[1]][anTryWhat[i][1]] != 0) {
        anWhat[1] = anTryWhat[i][1];
        anWhat[2] = anTryWhat[i][0];
        break;
      }
    }
  }
  // 搜索这几组牌
  let abFound = [false, false, false];
  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    //		if ( sHuResult.asGroup[nGroupIndex].nGroupStyle == GROUP_STYLE_KE )
    if (this.IsKe(sHuResult.asGroup[nGroupIndex])) {
      for (i = 0; i < 3; i++) {
        if (!abFound[i] && sHuResult.asGroup[nGroupIndex].asStone[0].nColor == anColor[i]
          && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == anWhat[i]) {
          abFound[i] = true;
          sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
            sFanInfo.anTileID, sFanInfo.cnTile);
        }
      }
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//43 无番和 和牌后，数不出任何番种分(花牌不计算在内)
//
// **************************************************************************************
CJudge.prototype.ParseWuFan = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_WUFAN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_WUFAN].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//44 妙手回春 自摸牌墙上最后一张牌和牌。不计自摸
//
// **************************************************************************************
CJudge.prototype.ParseMiaoShou = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_MIAOSHOU;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_MIAOSHOU].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//45 海底捞月 和打出的最后一张牌
//
// **************************************************************************************
CJudge.prototype.ParseHaiDi = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HAIDI;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HAIDI].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//46 杠上开花 开杠抓进的牌成和牌(不包括补花)不计自摸
//
// **************************************************************************************
CJudge.prototype.ParseGangKai = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_GANGHU;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_GANGHU].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//47 抢杠和 和别人自抓开明杠的牌。不计和绝张
//
// **************************************************************************************
CJudge.prototype.ParseQiangGang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QIANGGANG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QIANGGANG].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//
//6 番
//48 碰碰和 由4副刻子(或杠)、将牌组成的和牌
//
// **************************************************************************************
CJudge.prototype.ParsePenPenHu = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_PENPENHU;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_PENPENHU].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//49 混一色 由一种花色序数牌及字牌组成的和牌
//
// **************************************************************************************
CJudge.prototype.ParseHun1She = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HUN1SHE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HUN1SHE].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//50 三色三步高 3种花色3副依次递增一位序数的顺子
//
// **************************************************************************************
CJudge.prototype.Parse3She3BuGao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_3SHE3BUGAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_3SHE3BUGAO].nScore;

  let anColor = [0, 0, 0];
  let anWhat = [0, 0, 0];
  // 找出只有一个刻子的花色
  for (anColor[0] = 0; anColor[0] < 3; anColor[0]++) {
    if (this.m_sStonesRelation.acnAllColors[anColor[0]] == 3) {
      // 要找的就是它
      break;
    }
  }

  // 找出这个顺子
  for (anWhat[0] = 0; anWhat[0] <= Define.STONE_NO7; anWhat[0]++) {
    if (this.m_sGroupsRelation.acnShunGroups[anColor[0]][anWhat[0]] != 0) {
      break;
    }
  }
  // 另外两个花色
  anColor[1] = (anColor[0] + 1) % 3;
  anColor[2] = (anColor[0] + 2) % 3;

  // 共6种组合方式(数字表示刚找到的那个刻)
  // 1二三
  // 1三二
  // 一2三
  // 三2一
  // 一二3
  // 二一3
  let anTryWhat = [[0, 0], [0, 0], [0, 0]];
  anTryWhat[0][0] = anWhat[0] + 2 <= Define.STONE_NO7 ? anWhat[0] + 1 : 0xff;
  anTryWhat[0][1] = anWhat[0] + 2 <= Define.STONE_NO7 ? anWhat[0] + 2 : 0xff;
  anTryWhat[1][0] = (anWhat[0] - 1 >= Define.STONE_NO1 && anWhat[0] + 1 <= Define.STONE_NO7) ? anWhat[0] - 1 : 0xff;
  anTryWhat[1][1] = (anWhat[0] - 1 >= Define.STONE_NO1 && anWhat[0] + 1 <= Define.STONE_NO7) ? anWhat[0] + 1 : 0xff;
  anTryWhat[2][0] = anWhat[0] - 2 >= Define.STONE_NO1 ? anWhat[0] - 2 : 0xff;
  anTryWhat[2][1] = anWhat[0] - 2 >= Define.STONE_NO1 ? anWhat[0] - 1 : 0xff;
  let i = 0;
  for (i = 0; i < 3; i++) {
    if (anTryWhat[i][0] != 0xff) {
      if (this.m_sGroupsRelation.acnShunGroups[anColor[1]][anTryWhat[i][0]] != 0
        && this.m_sGroupsRelation.acnShunGroups[anColor[2]][anTryWhat[i][1]] != 0) {
        anWhat[1] = anTryWhat[i][0];
        anWhat[2] = anTryWhat[i][1];
        break;
      }
      else if (this.m_sGroupsRelation.acnShunGroups[anColor[2]][anTryWhat[i][0]] != 0
        && this.m_sGroupsRelation.acnShunGroups[anColor[1]][anTryWhat[i][1]] != 0) {
        anWhat[1] = anTryWhat[i][1];
        anWhat[2] = anTryWhat[i][0];
        break;
      }
    }
  }

  // 搜索这几组牌
  let abFound = [false, false, false];
  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_SHUN) {
      for (i = 0; i < 3; i++) {
        if (!abFound[i] && sHuResult.asGroup[nGroupIndex].asStone[0].nColor == anColor[i]
          && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == anWhat[i]) {
          abFound[i] = true;
          sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
            sFanInfo.anTileID, sFanInfo.cnTile);
        }
      }
    }
  }


  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//51 五门齐 和牌时3种序数牌、风、箭牌齐全
//
// **************************************************************************************
CJudge.prototype.Parse5MenQi = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_5MENQI;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_5MENQI].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//52 全求人 全靠吃牌、碰牌、单钓别人批出的牌和牌。不计单钓
//
// **************************************************************************************
CJudge.prototype.ParseQuanQiuRen = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QUANQIUREN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QUANQIUREN].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//53 双暗杠 2个暗杠
//
// **************************************************************************************
CJudge.prototype.Parse2AnGang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_2ANGANG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_2ANGANG].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_ANGANG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//54 双箭刻 2副箭刻(或杠)
//
// **************************************************************************************
CJudge.prototype.Parse2JianKe = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_2JIANKE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_2JIANKE].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (this.IsKe(sHuResult.asGroup[nGroupIndex])
      && sHuResult.asGroup[nGroupIndex].asStone[0].nColor == Define.COLOR_JIAN) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//
//4 番
//55 全带幺 和牌时，每副牌、将牌都有幺牌
//
// **************************************************************************************
CJudge.prototype.ParseQuan1 = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QUANDAIYAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QUANDAIYAO].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//56 不求人 4副牌及将中没有吃牌、碰牌(包括明杠)，自摸和牌
//
// **************************************************************************************
CJudge.prototype.ParseBuQiuRen = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_BUQIUREN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_BUQIUREN].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//57 双明杠 2个明杠
//
// **************************************************************************************
CJudge.prototype.Parse2MinGang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_2MINGANG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_2MINGANG].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_MINGGANG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//58 和绝张 和牌池、桌面已亮明的3张牌所剩的第4张牌(抢杠和不计和绝张)
//
// **************************************************************************************
CJudge.prototype.ParseHuJueZhang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HUJUEZHANG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HUJUEZHANG].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//
//2 番
//59 箭刻 由中、发、白3张相同的牌组成的刻子
//
// **************************************************************************************
CJudge.prototype.ParseJianKe = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_JIANKE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_JIANKE].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (this.IsKe(sHuResult.asGroup[nGroupIndex])
      && sHuResult.asGroup[nGroupIndex].asStone[0].nColor == Define.COLOR_JIAN) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//60 圈风刻 与圈风相同的风刻
//
// **************************************************************************************
CJudge.prototype.ParseQuanFeng = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QUANFENG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QUANFENG].nScore;

  let nQuanWhat = (sHuResult.nQuanWind & 0x00f0) >> 4;
  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (this.IsKe(sHuResult.asGroup[nGroupIndex])//.nGroupStyle == GROUP_STYLE_KE
      && sHuResult.asGroup[nGroupIndex].asStone[0].nColor == Define.COLOR_WIND
      && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == nQuanWhat) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//61 门风刻 与本门风相同的风刻
//
// **************************************************************************************
CJudge.prototype.ParseMenFeng = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_MENGFENG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_MENGFENG].nScore;

  let nMenWhat = (sHuResult.nMenWind & 0x00f0) >> 4;
  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (this.IsKe(sHuResult.asGroup[nGroupIndex])//.nGroupStyle == GROUP_STYLE_KE
      && sHuResult.asGroup[nGroupIndex].asStone[0].nColor == Define.COLOR_WIND
      && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == nMenWhat) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//62 门前清 没有吃、碰、明杠，和别人打出的牌
//
// **************************************************************************************
CJudge.prototype.ParseMenQing = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_MENGQING;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_MENGQING].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//63 平和 由4副顺子及序数牌作将组成的和牌，边、坎、钓不影响平和
//
// **************************************************************************************
CJudge.prototype.ParsePinHu = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_PINHU;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_PINHU].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//64 四归一 和牌中，有4张相同的牌归于一家的顺、刻子、对、将牌中(不包括杠牌)
//
// **************************************************************************************
CJudge.prototype.Parse4Gui1 = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();

  // 可能会有多个四归一
  // 先找出所有有相同四张的牌
  let anLineIndex = [0, 0, 0, 0];	// 最多只可能有4杠
  let cnSame4Tile = 0;
  let i = 0;
  for (i = 0; i < 34; i++) {
    if (this.m_sStonesRelation.acnAllStones[i] >= 4) {
      anLineIndex[cnSame4Tile] = i;
      cnSame4Tile++;
    }
  }

  if (sHuResult.cnGroups == 14) {
    // 无分组的牌型
    for (i = 0; i < cnSame4Tile; i++) {
      sFanInfo.nID = Define.FAN_4GUI1;
      sFanInfo.nScore = this.m_asFanInfo[Define.FAN_4GUI1].nScore;

      for (let j = 0; j < 14; j++) {
        if (this.GetValue(sHuResult.asHandStone[j]) == anLineIndex[i]) {
          sFanInfo.anTileID[sFanInfo.cnTile] = sHuResult.asHandStone[j].nID;
          sFanInfo.cnTile++;
        }
      }

      vsFanInfo.push(sFanInfo);
    }
  }
  else {
    for (i = 0; i < cnSame4Tile; i++) {
      sFanInfo.nID = Define.FAN_4GUI1;
      sFanInfo.nScore = this.m_asFanInfo[Define.FAN_4GUI1].nScore;

      for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
        if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_MINGGANG
          || sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_ANGANG) {
          // 杠牌是不能算四归一的
          continue;
        }

        let cnTile = 3;
        if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_JONG) {
          cnTile = 2;
        }
        for (let nTileIndex = 0; nTileIndex < cnTile; nTileIndex++) {
          if (this.GetValue(sHuResult.asGroup[nGroupIndex].asStone[nTileIndex])
            == anLineIndex[i]) {
            sFanInfo.anTileID[sFanInfo.cnTile] = sHuResult.asGroup[nGroupIndex].asStone[nTileIndex].nID;
            sFanInfo.cnTile++;
          }
        }
      }

      if (sFanInfo.cnTile != 0) {
        vsFanInfo.push(sFanInfo);
      }
    }
  }

  return sHuResult.anFans[Define.FAN_4GUI1];
}

// **************************************************************************************
//
//65 双同刻 2副序数相同的刻子
//
// **************************************************************************************
CJudge.prototype.Parse2TongKe = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();

  // 可能会有多个双同刻
  let anWhat = [0, 0];// 最多两个
  let cnTongKe = 0;
  let i = 0;
  for (i = 0; i <= Define.STONE_NO9; i++) {
    if (this.m_sGroupsRelation.acnKeGroups[Define.COLOR_WAN][i]
      + this.m_sGroupsRelation.acnKeGroups[Define.COLOR_BING][i]
      + this.m_sGroupsRelation.acnKeGroups[Define.COLOR_TIAO][i] >= 2) {
      anWhat[cnTongKe] = i;
      cnTongKe++;
    }
  }
  for (i = 0; i < cnTongKe; i++) {
    sFanInfo.nID = Define.FAN_2TONGKE;
    sFanInfo.nScore = this.m_asFanInfo[Define.FAN_2TONGKE].nScore;

    for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
      if (this.IsKe(sHuResult.asGroup[nGroupIndex])// .nGroupStyle == GROUP_STYLE_KE
        && sHuResult.asGroup[nGroupIndex].asStone[0].nColor < Define.COLOR_WIND
        && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == anWhat[i]) {
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
          sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }
    vsFanInfo.push(sFanInfo);
  }

  return sHuResult.anFans[Define.FAN_2TONGKE];
}

// **************************************************************************************
//
//66 双暗刻 2个暗刻
//
// **************************************************************************************
CJudge.prototype.Parse2AnKe = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_2ANKE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_2ANKE].nScore;

  // 分组的排列顺序是吃碰杠的牌在前，将牌在最后
  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (nGroupIndex < sHuResult.cnShowGroups) {
      // 在吃碰杠的分组里只找暗杠
      if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_ANGANG) {
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex], sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }
    else if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_KE) {
      // 如果不是自摸的，除了和的张牌所在的刻，其余的刻都拷进去
      if ((sHuResult.nWinMode & Define.WIN_MODE_ZIMO) == 0
        && (sHuResult.asGroup[nGroupIndex].asStone[0].nID == sHuResult.nHuTileID
          || sHuResult.asGroup[nGroupIndex].asStone[1].nID == sHuResult.nHuTileID
          || sHuResult.asGroup[nGroupIndex].asStone[2].nID == sHuResult.nHuTileID)) {
        continue;
      }
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex], sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//67 暗杠 自抓4张相同的牌开杠
//
// **************************************************************************************
CJudge.prototype.ParseAnGang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_ANGANG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_ANGANG].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnShowGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_ANGANG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }
  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//68 断幺 和牌中没有一、九及字牌
//
// **************************************************************************************
CJudge.prototype.ParseDuan19 = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_DUAN19;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_DUAN19].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
// 1 番
//69 一般高 由一种花色2副相同的顺子组成的牌
//
// **************************************************************************************
CJudge.prototype.ParseYiBanGao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();

  // 可能会有多个一般高
  let cnSame2Shun = 0;
  let anColor = [0, 0];
  let anWhat = [0, 0];		// 最多两个
  let i = 0;
  for (i = 0; i < 3; i++) {
    for (let j = 0; j < 7; j++) {
      if (this.m_sGroupsRelation.acnShunGroups[i][j] == 2) {
        anColor[cnSame2Shun] = i;
        anWhat[cnSame2Shun] = j;
        cnSame2Shun++;
      }
    }
  }
  for (i = 0; i < cnSame2Shun; i++) {
    sFanInfo.nID = Define.FAN_YIBANGAO;
    sFanInfo.nScore = this.m_asFanInfo[Define.FAN_YIBANGAO].nScore;

    for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
      if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_SHUN
        && sHuResult.asGroup[nGroupIndex].asStone[0].nColor == anColor[i]
        && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == anWhat[i]) {
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
          sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }

    vsFanInfo.push(sFanInfo);
  }

  return sHuResult.anFans[Define.FAN_YIBANGAO];
}

// **************************************************************************************
//
//70 喜相逢 2种花色2副序数相同的顺子
//
// **************************************************************************************
CJudge.prototype.ParseXiXiangFeng = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();

  // 可能会有多个喜相逢
  let cnXiXiangFeng = 0;
  let anWhat = [0, 0];	// 最多两个喜相逢
  let i = 0;
  for (i = 0; i <= Define.STONE_NO7; i++) {
    if (((this.m_sGroupsRelation.acnShunGroups[Define.COLOR_WAN][i] != 0 ? 1 : 0)
      + (this.m_sGroupsRelation.acnShunGroups[Define.COLOR_TIAO][i] != 0 ? 1 : 0)
      + (this.m_sGroupsRelation.acnShunGroups[Define.COLOR_BING][i] != 0 ? 1 : 0)) == 2) {
      anWhat[cnXiXiangFeng] = i;
      cnXiXiangFeng++;
    }
  }
  for (i = 0; i < cnXiXiangFeng; i++) {
    sFanInfo.nID = Define.FAN_XIXIANGFENG;
    sFanInfo.nScore = this.m_asFanInfo[Define.FAN_XIXIANGFENG].nScore;

    let abFound = [false, false, false];
    for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
      if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_SHUN
        && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == anWhat[i]) {
        let nColor = sHuResult.asGroup[nGroupIndex].asStone[0].nColor;
        if (abFound[nColor]) {
          // 这种花色已经有一顺了
          continue;
        }
        abFound[nColor] = true;
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
          sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }

    vsFanInfo.push(sFanInfo);
  }


  return sHuResult.anFans[Define.FAN_XIXIANGFENG];
}

// **************************************************************************************
//
//71 连六 一种花色6张相连接的序数牌
//
// **************************************************************************************
CJudge.prototype.ParseLian6 = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();

  // 可能会有2个连6
  let cnLian6 = 0;
  let anColor = [0, 0];
  let anWhat = [0, 0];
  let i = 0;
  for (i = 0; i < 3; i++) {
    for (let j = 0; j <= Define.STONE_NO4; j++) {
      // 第一顺最大只能是456
      if (this.m_sGroupsRelation.acnShunGroups[i][j] != 0
        && this.m_sGroupsRelation.acnShunGroups[i][j + 3] != 0) {
        anColor[cnLian6] = i;
        anWhat[cnLian6] = j;
        cnLian6++;
      }
    }
  }

  for (i = 0; i < cnLian6; i++) {
    sFanInfo.nID = Define.FAN_LIAN6;
    sFanInfo.nScore = this.m_asFanInfo[Define.FAN_LIAN6].nScore;

    let abFound = [false, false];

    for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
      if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_SHUN
        && sHuResult.asGroup[nGroupIndex].asStone[0].nColor == anColor[i]) {
        if (sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == anWhat[i]
          && !abFound[0]) {
          abFound[0] = true;
          sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
            sFanInfo.anTileID, sFanInfo.cnTile);
        }
        else if (sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == anWhat[i] + 3
          && !abFound[1]) {
          abFound[1] = true;
          sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
            sFanInfo.anTileID, sFanInfo.cnTile);
        }
      }
    }
    vsFanInfo.push(sFanInfo);
  }

  return sHuResult.anFans[Define.FAN_LIAN6];
}

// **************************************************************************************
//
//72 老少副 一种花色牌的123、789两副顺子
//
// **************************************************************************************
CJudge.prototype.ParseLaoShaoFu = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();

  // 可能会有两个老少副
  let cnLaoShaoFu = 0;
  let anColor = [0, 0];
  let i = 0;
  for (i = 0; i < 3; i++) {
    if (this.m_sGroupsRelation.acnShunGroups[i][Define.STONE_NO1] != 0
      && this.m_sGroupsRelation.acnShunGroups[i][Define.STONE_NO7] != 0) {
      anColor[cnLaoShaoFu] = i;
      cnLaoShaoFu++;
    }
  }
  for (i = 0; i < cnLaoShaoFu; i++) {
    sFanInfo.nID = Define.FAN_LAOSHAOFU;
    sFanInfo.nScore = this.m_asFanInfo[Define.FAN_LAOSHAOFU].nScore;

    let abFound = [false, false];

    for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
      if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_SHUN
        && sHuResult.asGroup[nGroupIndex].asStone[0].nColor == anColor[i]) {
        if (sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == Define.STONE_NO1
          && !abFound[0]) {
          abFound[0] = true;
          sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
            sFanInfo.anTileID, sFanInfo.cnTile);
        }
        else if (sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == Define.STONE_NO7
          && !abFound[1]) {
          abFound[1] = true;
          sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
            sFanInfo.anTileID, sFanInfo.cnTile);
        }
      }
    }
    vsFanInfo.push(sFanInfo);
  }

  return sHuResult.anFans[Define.FAN_LAOSHAOFU];
}

// **************************************************************************************
//
//73 幺九刻 3张相同的一、九序数牌及字牌组成的刻子(或杠)
// 风刻有三个或以上以则所有风刻不计幺九刻
// 与圈风或门风相同的风刻不计幺九刻
// 箭牌不计幺九刻
//
// **************************************************************************************
CJudge.prototype.Parse19Ke = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();

  // 可能会有多个幺九刻
  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (!this.Is19Ke(sHuResult.asGroup[nGroupIndex])) {
      continue;
    }

    // 是19刻，看看其它的限制条件
    if (sHuResult.asGroup[nGroupIndex].asStone[0].nColor == Define.COLOR_WIND) {
      // 是风牌
      if (sHuResult.anFans[Define.FAN_4FANGDAFA] != 0 || sHuResult.anFans[Define.FAN_DA4XI] != 0
        || sHuResult.anFans[Define.FAN_XIAO4XI] != 0 || sHuResult.anFans[Define.FAN_3FENGKE] != 0) {
        // 有三个以上的风刻，该刻不计幺九刻
        continue;
      }
      let nWhat = sHuResult.asGroup[nGroupIndex].asStone[0].nWhat;
      if (nWhat == (sHuResult.nQuanWind & 0x00f0) >> 4
        || nWhat == (sHuResult.nMenWind & 0x00f0) >> 4) {
        // 这个刻已计了圈风刻或门风刻，也不计幺九刻
        continue;
      }
    }

    sFanInfo.nID = Define.FAN_19KE;
    sFanInfo.nScore = this.m_asFanInfo[Define.FAN_19KE].nScore;
    sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex], sFanInfo.anTileID, sFanInfo.cnTile);

    vsFanInfo.push(sFanInfo);
  }

  return sHuResult.anFans[Define.FAN_19KE];
}

// **************************************************************************************
//
//74 明杠 自己有暗刻，碰别人打出的一张相同的牌开杠：或自己抓进一张与碰的明刻相同的牌开杠
//
// **************************************************************************************
CJudge.prototype.ParseMinGang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_MINGANG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_MINGANG].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_MINGGANG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
      break;	// 只能有一个明杠
    }
  }

  vsFanInfo.push(sFanInfo);

  return 1;
}

// **************************************************************************************
//
//75 缺一门 和牌中缺少一种花色序数牌
//
// **************************************************************************************
CJudge.prototype.ParseQue1Meng = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_QUE1MEN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_QUE1MEN].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//76 无字 和牌中没有风、箭牌
//
// **************************************************************************************
CJudge.prototype.ParseWuZi = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_WUZI;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_WUZI].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
//77 边张 单和123的3及789的7或1233和3、77879和7都为边张。手中有12345和3，56789和7不算边张
//
// **************************************************************************************
CJudge.prototype.ParseBianZang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_BIANZANG].nScore;
  sFanInfo.nID = Define.FAN_BIANZANG;
  sFanInfo.anTileID[0] = sHuResult.nHuTileID;
  sFanInfo.cnTile = 1;
  vsFanInfo.push(sFanInfo);

  return 1;

  /*
   // 和的那张牌有可能被用作别的用途了，所以这里要找到一张与和的那张牌花色点数相同的牌,
   // 且这张牌是被用作边张了

   // 先找到和的那张牌
   let nHuColor;// = this.m_pCheckParam.asHandStone[0].nColor;
   let nHuWhat;// = this.m_pCheckParam.asHandStone[0].nWhat;

   if ( IsHun( sHuResult.nHuTileID ) )
   {
   // 如果最后和的那张是混牌，还要到分组里去搜索，看它变成什么牌了
   GetUsedHunInfo( sHuResult.nHuTileID, sHuResult.asGroup, nHuColor, nHuWhat );
   }
   else
   {
   nHuColor = ( sHuResult.nHuTileID & 0x0f00 ) >> 8;
   nHuWhat = ( sHuResult.nHuTileID & 0x00f0 ) >> 4;
   }
   let nCheckTile;
   if ( nHuWhat == STONE_NO3 )
   {
   // 第3张
   nCheckTile = 2;
   }
   else if ( nHuWhat == STONE_NO7 )
   {
   // 第1张
   nCheckTile = 0;
   }
   else
   {
   ASSERT( false );
   }

   // 看看那张牌是被用作边张了
   for( let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++ )
   {
   if ( sHuResult.asGroup[nGroupIndex].nGroupStyle == GROUP_STYLE_SHUN
   && sHuResult.asGroup[nGroupIndex].asStone[nCheckTile].nColor == nHuColor
   && sHuResult.asGroup[nGroupIndex].asStone[nCheckTile].nWhat == nHuWhat )
   {
   sFanInfo.anTileID[0] = sHuResult.asGroup[nGroupIndex].asStone[nCheckTile].nID;
   break;
   }
   }
   ASSERT( nGroupIndex != sHuResult.cnGroups );
   sFanInfo.cnTile = 1;
   vsFanInfo.push( sFanInfo );

   return 1;
   */
}

// **************************************************************************************
//
//78 坎张 和2张牌之间的牌。4556和5也为坎张，手中有45567和6不算坎张
//
// **************************************************************************************
CJudge.prototype.ParseKanZang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_KANZANG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_KANZANG].nScore;
  sFanInfo.anTileID[0] = sHuResult.nHuTileID;
  sFanInfo.cnTile = 1;
  vsFanInfo.push(sFanInfo);

  return 1;

  /*
   // 和的那张牌有可能被用作别的用途了，所以这里要找到一张与和的那张牌花色点数相同的牌,
   // 且这张牌是被用作坎张了
   // 先找到和的那张牌
   let nHuColor;// = this.m_pCheckParam.asHandStone[0].nColor;
   let nHuWhat;// = this.m_pCheckParam.asHandStone[0].nWhat;
   if ( IsHun( sHuResult.nHuTileID ) )
   {
   // 如果最后和的那张是混牌，还要到分组里去搜索，看它变成什么牌了
   GetUsedHunInfo( sHuResult.nHuTileID, sHuResult.asGroup, nHuColor, nHuWhat );
   }
   else
   {
   nHuColor = ( sHuResult.nHuTileID & 0x0f00 ) >> 8;
   nHuWhat = ( sHuResult.nHuTileID & 0x00f0 ) >> 4;
   }
   // 看看那张牌是被用作坎张了
   for( let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++ )
   {
   if ( sHuResult.asGroup[nGroupIndex].nGroupStyle == GROUP_STYLE_SHUN
   && sHuResult.asGroup[nGroupIndex].asStone[1].nColor == nHuColor
   && sHuResult.asGroup[nGroupIndex].asStone[1].nWhat == nHuWhat )
   {
   sFanInfo.anTileID[0] = sHuResult.asGroup[nGroupIndex].asStone[1].nID;
   break;
   }
   }
   ASSERT( nGroupIndex != sHuResult.cnGroups );

   sFanInfo.cnTile = 1;
   vsFanInfo.push( sFanInfo );

   return 1;
   */
}

// **************************************************************************************
//
//79 单钓将 钓单张牌作将成和
//
// **************************************************************************************
CJudge.prototype.ParseDanDiao = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_DANDIAO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_DANDIAO].nScore;
  sFanInfo.anTileID[0] = sHuResult.nHuTileID;
  sFanInfo.cnTile = 1;
  vsFanInfo.push(sFanInfo);

  return 1;

  /*
   // 最后一组是将牌
   sFanInfo.anTileID[0] = sHuResult.asGroup[sHuResult.cnGroups - 1].asStone[0].nID;
   sFanInfo.cnTile = 1;
   vsFanInfo.push( sFanInfo );

   return 1;
   */
}

// **************************************************************************************
//
//80 自摸 自己抓进牌成和牌
//
// **************************************************************************************
CJudge.prototype.ParseZiMo = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_ZIMO;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_ZIMO].nScore;
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
// 81 花牌 即春夏秋冬，梅兰竹菊，每花计一分。不计在起和分内，和牌后才能计分。
// 花牌补花成和计自摸分，不计杠上开花
//
// **************************************************************************************
CJudge.prototype.ParseHua = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_FLOWER;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_FLOWER].nScore * sHuResult.cnFlower;
  for (let i = 0; i < sHuResult.cnFlower; i++) {
    sFanInfo.anTileID[i] = sHuResult.asFlower[i].nID;
  }
  sFanInfo.cnTile = sHuResult.cnFlower;
  //vsFanInfo.push( sFanInfo );
  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return sHuResult.anFans[Define.FAN_FLOWER];
}

// 以下是大众麻将的番种
// 对大众麻将的番种要使用插入排序插入到正确的位置
// 168番
// **************************************************************************************
//
// 82 四方大发财
//
// **************************************************************************************
CJudge.prototype.Parse4FangDaFa = function (sHuResult, vsFanInfo) {

  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_4FANGDAFA;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_4FANGDAFA].nScore;

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// **************************************************************************************
//
// 83 天和
//
// **************************************************************************************
CJudge.prototype.ParseTianHu = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_TIANHU;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_TIANHU].nScore;

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// **************************************************************************************
//
// 158番
// 84 地和
//
// **************************************************************************************
CJudge.prototype.ParseDiHu = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_DIHU;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_DIHU].nScore;

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// 108番
// **************************************************************************************
//
// 85 人和
//
// **************************************************************************************
CJudge.prototype.ParseRenHu = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_RENHU;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_RENHU].nScore;

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// 88番
// **************************************************************************************
//
// 86 混杠
//
// **************************************************************************************
CJudge.prototype.ParseHunGang = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HUNGANG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HUNGANG].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if ((sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_MINGGANG
      || sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_ANGANG)
      && IsHun(sHuResult.asGroup[nGroupIndex].asStone[0])) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// **************************************************************************************
//
// 87 八仙过海，手上有八张花牌，不计春夏秋冬，梅兰竹菊
//
// **************************************************************************************
CJudge.prototype.Parse8Xian = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_8XIANGUOHAI;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_8XIANGUOHAI].nScore;

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// 32番
// **************************************************************************************
//
// 88 七抢一，手上有七张花牌和牌，另一家手上有一张花牌，不计春夏秋冬，梅兰竹菊
//
// **************************************************************************************
CJudge.prototype.Parse7Qiang1 = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_7QIANG1;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_7QIANG1].nScore;

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// **************************************************************************************
//
// 89 天听
//
// **************************************************************************************
CJudge.prototype.ParseTianTing = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_TIANTING;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_TIANTING].nScore;

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// 6番
// **************************************************************************************
//
// 90 混四节
//
// **************************************************************************************
CJudge.prototype.ParseHun4Jie = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HUN4JIE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HUN4JIE].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle != Define.GROUP_STYLE_JONG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// 4番
// **************************************************************************************
//
// 91 混四步
//
// **************************************************************************************
CJudge.prototype.ParseHun4Bu = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HUN4BU;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HUN4BU].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle != Define.GROUP_STYLE_JONG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
    }
  }

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// **************************************************************************************
//
// 92 混三节
//
// **************************************************************************************
CJudge.prototype.ParseHun3Jie = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HUN3JIE;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HUN3JIE].nScore;

  let nFirstWhat = 0;
  for (nFirstWhat = 0; nFirstWhat < Define.STONE_NO8; nFirstWhat++) {
    if (this.m_sGroupsRelation.acnKeGroups[0][nFirstWhat] == 0
      && this.m_sGroupsRelation.acnKeGroups[1][nFirstWhat] == 0
      && this.m_sGroupsRelation.acnKeGroups[2][nFirstWhat] == 0) {
      // 三个花色都没有刻
      continue;
    }

    // 找到一个刻了，看看其后有没有满足要求的刻
    if ((this.m_sGroupsRelation.acnKeGroups[0][nFirstWhat + 1] != 0
      || this.m_sGroupsRelation.acnKeGroups[1][nFirstWhat + 1] != 0
      || this.m_sGroupsRelation.acnKeGroups[2][nFirstWhat + 1] != 0)
      && (this.m_sGroupsRelation.acnKeGroups[0][nFirstWhat + 2] != 0
        || this.m_sGroupsRelation.acnKeGroups[1][nFirstWhat + 2] != 0
        || this.m_sGroupsRelation.acnKeGroups[2][nFirstWhat + 2] != 0)) {
      // 找到
      break;
    }
  }

  let abFound = [false, false, false];
  for (let i = 0; i < 3; i++) {
    for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
      if (this.IsKe(sHuResult.asGroup[nGroupIndex])
        && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == nFirstWhat + i
        && !abFound[i]) {
        abFound[i] = true;
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
          sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }
  }
  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// 2番
// **************************************************************************************
//
// 93 无混
//
// **************************************************************************************
CJudge.prototype.ParseWuHun = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_WUHUN;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_WUHUN].nScore;

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// **************************************************************************************
//
// 94 混龙
//
// **************************************************************************************
CJudge.prototype.ParseHunLong = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HUNLONG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HUNLONG].nScore;

  // 如果有清龙或花龙是不计混龙的，所以这里就简单了
  let abFound = [false, false, false];
  for (let i = 0; i < 3; i++) {
    for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
      if (!abFound[i] && sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_SHUN
        && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == i * 3) {
        abFound[i] = true;
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
          sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }
  }
  this.InsertFanInfo(vsFanInfo, sFanInfo);
  return 1;
}

// **************************************************************************************
//
// 95 混三步
//
// **************************************************************************************
CJudge.prototype.ParseHun3Bu = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_HUN3BU;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_HUN3BU].nScore;

  let nFirstWhat = 0;
  for (nFirstWhat = 0; nFirstWhat < Define.STONE_NO6; nFirstWhat++) {
    if (this.m_sGroupsRelation.acnShunGroups[0][nFirstWhat] == 0
      && this.m_sGroupsRelation.acnShunGroups[1][nFirstWhat] == 0
      && this.m_sGroupsRelation.acnShunGroups[2][nFirstWhat] == 0) {
      // 三个花色都没有顺
      continue;
    }

    // 找到一个顺了，看看其后有没有满足要求的顺
    if ((this.m_sGroupsRelation.acnShunGroups[0][nFirstWhat + 1] != 0
      || this.m_sGroupsRelation.acnShunGroups[1][nFirstWhat + 1] != 0
      || this.m_sGroupsRelation.acnShunGroups[2][nFirstWhat + 1] != 0)
      && (this.m_sGroupsRelation.acnShunGroups[0][nFirstWhat + 2] != 0
        || this.m_sGroupsRelation.acnShunGroups[1][nFirstWhat + 2] != 0
        || this.m_sGroupsRelation.acnShunGroups[2][nFirstWhat + 2] != 0)) {
      // 找到
      break;
    }
  }

  let abFound = [false, false, false];
  for (let i = 0; i < 3; i++) {
    for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
      if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_SHUN
        && sHuResult.asGroup[nGroupIndex].asStone[0].nWhat == nFirstWhat + i
        && !abFound[i]) {
        abFound[i] = true;
        sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
          sFanInfo.anTileID, sFanInfo.cnTile);
      }
    }
  }

  this.InsertFanInfo(vsFanInfo, sFanInfo);

  return 1;
}

// **************************************************************************************
//
// 96 立直
//
// **************************************************************************************
CJudge.prototype.ParseLiZhi = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_LIZHI;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_LIZHI].nScore;
  this.InsertFanInfo(vsFanInfo, sFanInfo);
  return 1;
}

// 1番
// **************************************************************************************
//
// 97 二五八将
//
// **************************************************************************************
CJudge.prototype.Parse258Jong = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_258JONG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_258JONG].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_JONG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
      break;
    }
  }

  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
// 98 梅兰竹菊，集齐这四张花牌之后额外加分
//
// **************************************************************************************
CJudge.prototype.Parse4Flower = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_4FLOWER;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_4FLOWER].nScore;

  for (let i = 0; i < sHuResult.cnFlower; i++) {
    if (sHuResult.asFlower[i].nColor == Define.COLOR_FLOWER) {
      sFanInfo.anTileID[sFanInfo.cnTile] = sHuResult.asFlower[i].nID;
      sFanInfo.cnTile++;
    }
  }
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
// 99 春夏秋冬，集齐这四张花牌之后额外加分
//
// **************************************************************************************
CJudge.prototype.Parse4Season = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_4SEASON;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_4SEASON].nScore;
  for (let i = 0; i < sHuResult.cnFlower; i++) {
    if (sHuResult.asFlower[i].nColor == Define.COLOR_SEASON) {
      sFanInfo.anTileID[sFanInfo.cnTile] = sHuResult.asFlower[i].nID;
      sFanInfo.cnTile++;
    }
  }
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
// 100 季花
//
// **************************************************************************************
CJudge.prototype.ParseJiHua = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_SEASONFLOWER;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_SEASONFLOWER].nScore * sHuResult.anFans[Define.FAN_SEASONFLOWER];

  for (let i = 0; i < sHuResult.cnFlower; i++) {
    if (sHuResult.asFlower[i].nWhat == ((sHuResult.nMenWind & 0x00f0) >> 4)) {
      sFanInfo.anTileID[sFanInfo.cnTile] = sHuResult.asFlower[i].nID;
      sFanInfo.cnTile++;
    }
  }
  this.InsertFanInfo(vsFanInfo, sFanInfo);
  return sHuResult.anFans[Define.FAN_SEASONFLOWER];
}

// **************************************************************************************
//
// 101 么九头 由序数牌的19做将牌
//
// **************************************************************************************
CJudge.prototype.Parse19Jong = function (sHuResult, vsFanInfo) {
  let sFanInfo = new tagFanInfo();
  sFanInfo.nID = Define.FAN_19JONG;
  sFanInfo.nScore = this.m_asFanInfo[Define.FAN_19JONG].nScore;

  for (let nGroupIndex = 0; nGroupIndex < sHuResult.cnGroups; nGroupIndex++) {
    if (sHuResult.asGroup[nGroupIndex].nGroupStyle == Define.GROUP_STYLE_JONG) {
      sFanInfo.cnTile += this.GetID(sHuResult.asGroup[nGroupIndex],
        sFanInfo.anTileID, sFanInfo.cnTile);
      break;
    }
  }
  vsFanInfo.push(sFanInfo);
  return 1;
}

// **************************************************************************************
//
// 获得一组牌的ID
//
// **************************************************************************************
CJudge.prototype.GetID = function (sGroup, anTileID, idx) {
  let i = 0;
  for (i = 0; i < 4; i++) {
    if (sGroup.asStone[i].nID != 0) {
      anTileID[idx + i] = sGroup.asStone[i].nID;
    }
    else {
      break;
    }
  }

  return i;
}

// **************************************************************************************
//
// 是不是刻
//
// **************************************************************************************
CJudge.prototype.IsKe = function (sGroup) {
  if (sGroup.nGroupStyle == Define.GROUP_STYLE_KE
    || sGroup.nGroupStyle == Define.GROUP_STYLE_MINGGANG
    || sGroup.nGroupStyle == Define.GROUP_STYLE_ANGANG) {
    return true;
  }

  return false;
}

// **************************************************************************************
//
// 是不是幺九刻
//
// **************************************************************************************
CJudge.prototype.Is19Ke = function (sGroup) {
  if (!this.IsKe(sGroup) || sGroup.asStone[0].nColor == Define.COLOR_JIAN) {
    return false;
  }

  if (sGroup.asStone[0].nColor == Define.COLOR_WIND
    || sGroup.asStone[0].nColor >= Define.COLOR_WAN && sGroup.asStone[0].nColor <= Define.COLOR_BING
    && (sGroup.asStone[0].nWhat == Define.STONE_NO1 || sGroup.asStone[0].nWhat == Define.STONE_NO9)) {
    return true;
  }

  return false;
}

// **************************************************************************************
//
// 将一个番种信息插入到正确的位置
//
// **************************************************************************************
CJudge.prototype.InsertFanInfo = function (vsFanInfo, sFanInfo) {
  let i;
  for (i = 0; i < vsFanInfo.length; i++) {
    if (vsFanInfo[i].nScore < sFanInfo.nScore) {
      vsFanInfo.splice(i + 1, 0, sFanInfo);
      break;
    }
  }

  if (i == vsFanInfo.length) {
    // 一直到最后都没找到合适的位置，加到最后
    vsFanInfo.push(sFanInfo);
  }
}

// **************************************************************************************
//
// 是不是顺
//
// **************************************************************************************
CJudge.prototype.IsShun = function (asTile) {

  for (let i = 0; i < 3; i++) {
    if (asTile[i].nColor < 0 || asTile[i].nColor >= Define.COLOR_WIND) {
      return false;
    }
    if (asTile[i].nColor != asTile[0].nColor || asTile[i].nWhat != asTile[0].nWhat + i) {
      return false;
    }
  }

  return true;
}

// **************************************************************************************
//
// 是不是刻
//
// **************************************************************************************
CJudge.prototype.Is_Ke = function (asTile) {

  for (let i = 0; i < 3; i++) {
    if (asTile[i].nColor < 0 || asTile[i].nColor > Define.COLOR_JIAN) {
      return false;
    }
    if (asTile[i].nColor != asTile[0].nColor || asTile[i].nWhat != asTile[0].nWhat) {
      return false;
    }
  }

  return true;
}

// **************************************************************************************
//
// 是不是杠
//
// **************************************************************************************
CJudge.prototype.IsGang = function (asTile) {
  for (let i = 0; i < 4; i++) {
    if (asTile[i].nColor < 0 || asTile[i].nColor > Define.COLOR_JIAN) {
      return false;
    }
    if (asTile[i].nColor != asTile[0].nColor || asTile[i].nWhat != asTile[0].nWhat) {
      return false;
    }
  }

  return true;
}

// **************************************************************************************
//
// 是不是龙
//
// **************************************************************************************
CJudge.prototype.IsLong = function (asTile) {
  for (let i = 0; i < 3; i++) {
    if (asTile[i].nColor < 0 || asTile[i].nColor >= Define.COLOR_WIND) {
      return false;
    }
    if (asTile[i].nColor != asTile[0].nColor || asTile[i].nWhat != asTile[0].nWhat + i * 3) {
      return false;
    }
  }

  return true;
}

// **************************************************************************************
//
// 是不是将
//
// **************************************************************************************
CJudge.prototype.IsJong = function (asTile) {
  for (let i = 0; i < 2; i++) {
    if (asTile[i].nColor < 0 || asTile[i].nColor > Define.COLOR_JIAN) {
      return false;
    }
    if (asTile[i].nColor != asTile[0].nColor || asTile[i].nWhat != asTile[0].nWhat) {
      return false;
    }
  }

  return true;
}

// **************************************************************************************
//
// 是不是有效的牌
//
// **************************************************************************************
CJudge.prototype.ValidTile = function (sTile, sCheckParam, anAppearedTileID, cnAppearedTile) {
  // ID号不能是0
  if (sTile.nID == 0) {
    return false;
  }

  // 花色点数必须得和ID号一致，除非是混牌
  if (!this.IsHun(sTile)
    && (sTile.nID & 0x0ff0) != (sTile.nColor << 8) + (sTile.nWhat << 4)) {
    return false;
  }

  // 手上有没有这张牌
  let i = 0;
  for (i = 0; i < sCheckParam.cnHandStone; i++) {
    if (sCheckParam.asHandStone[i].nID == sTile.nID) {
      break;
    }
  }
  if (i == sCheckParam.cnHandStone) {
    // 没找到，看看吃碰杠的牌里有没有
    let j = 0;
    for (j = 0; j < sCheckParam.cnShowGroups; j++) {
      let k = 0;
      for (k = 0; k < 4; k++) {
        if (sTile.nID == sCheckParam.asShowGroup[j].asStone[k].nID) {
          break;
        }
      }
      if (k != 4) {
        break;
      }
    }
    if (j == sCheckParam.cnShowGroups) {
      // 也没找到这张牌
      return false;
    }
  }

  // 这张牌以前有没有出现过
  for (i = 0; i < cnAppearedTile; i++) {
    if (anAppearedTileID[i] == sTile.nID) {
      return false;
    }
  }
  // 这张牌没出现过
  anAppearedTileID[cnAppearedTile] = sTile.nID;
  cnAppearedTile++;

  return true;
}

let judge = module.exports;
judge.createjudge = function (rule) {
  let obj = CJudge.create(rule);
  return obj;
};
judge.FAN = Define.fanObj;
judge.STONE = Define.stoneObj;
judge.tagTileInfo = Define.tagTileInfo;
judge.tagFanInfo = Define.tagFanInfo;
judge.tagCallTileInfo = tagCallTileInfo;
judge.createtagCallInfo = function () {
  let obj = new Define.tagCallInfo();
  return obj;
};
judge.createGROUPSRELATION = function () {
  let obj = new Define.groupsRelation();
  return obj;
};
judge.createSTONEGROUP = function () {
  let obj = new Define.stoneGroup();
  return obj;
};
judge.createCHECKPARAM = function () {
  let obj = new Define.checkParam();
  return obj;
};
judge.createHURESULT = function () {
  let obj = new Define.huresult();
  return obj;
};

