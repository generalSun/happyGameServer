const Define = require('./commonDefine');
const constData = require('./constData');
let logger = require('pomelo-logger').getLogger('con-log');
const _ = require('lodash');
//////////////////////////////////////////////////////////////////////////

//类型子项
let tagKindItem = function () {
  this.cbWeaveKind = "";						//组合类型
  this.cbCenterCard = "";						//中心扑克
  this.cbCardIndex = [0, 0, 0];						//扑克索引
};

//组合子项
let tagWeaveItem = function () {
  this.cbWeaveKind = "";						//组合类型
  this.cbCenterCard = "";						//中心扑克
  this.cbPublicCard = "";						//公开标志
  this.wProvideUser = "";						//供应用户
};

//胡牌结果
let tagChiHuResult = function () {
  this.dwChiHuKind = "";						//吃胡类型
  this.dwChiHuRight = "";						//胡牌权位
  this.dwWinTimes = 0;							//番数数目
  this.detailTimes = [];
};

//杠牌结果
let tagGangCardResult = function () {
  this.cbCardCount = 0;						//扑克数目
  this.cbCardData = [0, 0, 0, 0];						//扑克数据
  this.cbGangType = 0;							//杠牌类型
};


//分析子项
let tagAnalyseItem = function () {
  this.cbCardEye = "";							//牌眼扑克
  this.cbWeaveKind = [0, 0, 0, 0];			//组合类型
  this.cbCenterCard = [0, 0, 0, 0];			//中心扑克
};


//////////////////////////////////////////////////////////////////////////

let MJApi = class {
  constructor() {
    this.m_cbHunCard = 0;						//混牌
  }

  _ZeroMemory(array, num) {
    for (let i = 0; i < num; i++) {
      array[i] = 0;
    }
  }
  //混乱扑克
  RandCardData(cbCardData, cbMaxCount) {
    ////混乱准备
    //let cbCardDataTemp=[];
    //_CopyMemory(cbCardDataTemp,cbCardData);
    //
    ////混乱扑克
    //let cbRandCount=0,cbPosition=0;
    //do
    //{
    //    cbPosition=rand()%(cbMaxCount-cbRandCount);
    //    cbCardData[cbRandCount++]=cbCardDataTemp[cbPosition];
    //    cbCardDataTemp[cbPosition]=cbCardDataTemp[cbMaxCount-cbRandCount];
    //} while (cbRandCount<cbMaxCount);

    return;
  }
  //删除扑克
  RemoveCard(cbCardIndex, cbRemoveCard) {
    //删除扑克
    let cbRemoveIndex = this.SwitchToCardIndex(cbRemoveCard);
    if (cbCardIndex[cbRemoveIndex] > 0) {
      cbCardIndex[cbRemoveIndex]--;
      return true;
    }
    return false;

  }

  //删除扑克
  RemoveCard3(cbCardIndex, cbRemoveCard, cbRemoveCount) {
    //删除扑克
    for (let i = 0; i < cbRemoveCount; i++) {
      //删除扑克
      let cbRemoveIndex = this.SwitchToCardIndex(cbRemoveCard[i]);
      if (cbCardIndex[cbRemoveIndex] == 0) {
        //还原删除
        for (let j = 0; j < i; j++) {
          cbCardIndex[this.SwitchToCardIndex(cbRemoveCard[j])]++;
        }

        return false;
      }
      else {
        //删除扑克
        --cbCardIndex[cbRemoveIndex];
      }
    }

    return true;
  }

  //删除扑克
  RemoveCard4(cbCardData, cbCardCount, cbRemoveCard, cbRemoveCount) {

    //定义变量
    let cbDeleteCount = 0;
    let cbTempCardData = _.cloneDeep(cbCardData);
    if (cbCardCount > 14)
      return false;
    //置零扑克
    for (let i = 0; i < cbRemoveCount; i++) {
      for (let j = 0; j < cbCardCount; j++) {
        if (cbRemoveCard[i] == cbTempCardData[j]) {
          cbDeleteCount++;
          cbTempCardData[j] = 0;
          break;
        }
      }
    }

    //成功判断
    if (cbDeleteCount != cbRemoveCount) {
      return false;
    }

    //清理扑克
    let cbCardPos = 0;
    for (let i = 0; i < cbCardCount; i++) {
      if (cbTempCardData[i] != 0)
        cbCardData[cbCardPos++] = cbTempCardData[i];
    }

    return true;
  }

  //有效判断
  IsValidCard(cbCardData) {
    let cbValue = (cbCardData & constData.MASK_VALUE);
    let cbColor = (cbCardData & constData.MASK_COLOR) >> 4;
    if ((cbColor >= Define.COLOR_WAN && cbColor <= Define.COLOR_BING) && (cbValue >= 1 && cbValue <= 9))
      return true;
    else if (cbColor == Define.COLOR_FENG_JIAN && (cbValue >= 1 && cbValue <= 7))
      return true;
    else if (cbColor == Define.COLOR_HUA && (cbValue >= 1 && cbValue <= 8))
      return true;
    else
      return false;
  }

  //是不是花
  IsHua(cbCardData) {
    return ((cbCardData & constData.MASK_COLOR) >> 4) == Define.COLOR_HUA;
  }

  //扑克数目
  GetCardCount(cbCardIndex) {
    //数目统计
    let cbCardCount = 0;
    for (let i = 0; i < constData.MAX_INDEX; i++)
      cbCardCount += cbCardIndex[i];

    return cbCardCount;
  }

  //获取组合
  GetWeaveCard(cbWeaveKind, cbCenterCard, cbCardBuffer) {
    //组合扑克
    switch (cbWeaveKind) {
      case constData.WIK_LEFT:		//zuo牌操作
        {
          //设置变量
          cbCardBuffer[0] = cbCenterCard;
          cbCardBuffer[1] = cbCenterCard + 1;
          cbCardBuffer[2] = cbCenterCard + 2;
          return 3;
        }
      case constData.WIK_RIGHT:		//you牌操作
        {
          //设置变量
          cbCardBuffer[0] = cbCenterCard;
          cbCardBuffer[1] = cbCenterCard - 1;
          cbCardBuffer[2] = cbCenterCard - 2;

          return 3;
        }
      case constData.WIK_CENTER:	//zhong牌操作
        {
          //设置变量
          cbCardBuffer[0] = cbCenterCard;
          cbCardBuffer[1] = cbCenterCard - 1;
          cbCardBuffer[2] = cbCenterCard + 1;

          return 3;
        }
      case constData.WIK_PENG:		//碰牌操作
        {
          //设置变量
          cbCardBuffer[0] = cbCenterCard;
          cbCardBuffer[1] = cbCenterCard;
          cbCardBuffer[2] = cbCenterCard;

          return 3;
        }
      case constData.WIK_GANG:		//杠牌操作
        {
          //设置变量
          cbCardBuffer[0] = cbCenterCard;
          cbCardBuffer[1] = cbCenterCard;
          cbCardBuffer[2] = cbCenterCard;
          cbCardBuffer[3] = cbCenterCard;

          return 4;
        }
      default:
        {

        }
    }

    return 0;
  }

  //动作等级
  GetUserActionRank(cbUserAction) {
    //胡牌等级
    if (cbUserAction & constData.WIK_CHI_HU) { return 4; }

    //杠牌等级
    if (cbUserAction & constData.WIK_GANG) { return 3; }

    //碰牌等级
    if (cbUserAction & constData.WIK_PENG) { return 2; }

    //上牌等级
    if (cbUserAction & (constData.WIK_RIGHT | constData.WIK_CENTER | constData.WIK_LEFT)) { return 1; }

    return 0;
  }

  //胡牌等级
  GetChiHuActionRank(ChiHuResult) {
    return 0;
  }

  //吃牌判断
  EstimateEatCard(cbCardIndex, cbCurrentCard) {
    //过滤判断
    //番子无连
    if (cbCurrentCard >= 0x31)
      return constData.WIK_NULL;

    //变量定义
    let cbExcursion = [0, 1, 2];
    let cbItemKind = [constData.WIK_LEFT, constData.WIK_CENTER, constData.WIK_RIGHT];

    //吃牌判断
    let cbEatKind = 0, cbFirstIndex = 0;
    let cbCurrentIndex = this.SwitchToCardIndex(cbCurrentCard);
    for (let i = 0; i < cbItemKind.length; i++) {
      let cbValueIndex = cbCurrentIndex % 9;
      if ((cbValueIndex >= cbExcursion[i]) && ((cbValueIndex - cbExcursion[i]) <= 6)) {
        //吃牌判断
        cbFirstIndex = cbCurrentIndex - cbExcursion[i];
        if ((cbCurrentIndex != cbFirstIndex) && (cbCardIndex[cbFirstIndex] == 0))
          continue;
        if ((cbCurrentIndex != (cbFirstIndex + 1)) && (cbCardIndex[cbFirstIndex + 1] == 0))
          continue;
        if ((cbCurrentIndex != (cbFirstIndex + 2)) && (cbCardIndex[cbFirstIndex + 2] == 0))
          continue;

        //设置类型
        cbEatKind |= cbItemKind[i];
      }
    }

    return cbEatKind;
  }

  //碰牌判断
  EstimatePengCard(cbCardIndex, cbCurrentCard) {
    //碰牌判断
    return (cbCardIndex[this.SwitchToCardIndex(cbCurrentCard)] >= 2) ? constData.WIK_PENG : constData.WIK_NULL;
  }

  //杠牌判断
  EstimateGangCard(cbCardIndex, cbCurrentCard) {
    //杠牌判断
    return (cbCardIndex[this.SwitchToCardIndex(cbCurrentCard)] == 3) ? constData.WIK_GANG : constData.WIK_NULL;
  }

  //听牌分析
  AnalyseTingCard(cbCardIndex, WeaveItem, cbItemCount, dwChiHuRight) {
    //变量定义
    let ChiHuResult = new tagChiHuResult();

    //构造扑克
    let cbCardIndexTemp = _.cloneDeep(cbCardIndex);

    //听牌分析
    for (let i = 0; i < constData.MAX_INDEX; i++) {
      //空牌过滤
      if (cbCardIndexTemp[i] == 0)
        continue;

      //听牌处理
      cbCardIndexTemp[i]--;

      //听牌判断
      for (let j = 0; j < constData.MAX_INDEX; j++) {
        //胡牌分析
        let cbCurrentCard = this.SwitchToCardData(j);
        let cbHuCardKind = this.AnalyseChiHuCard(cbCardIndexTemp, WeaveItem, cbItemCount, cbCurrentCard, dwChiHuRight, ChiHuResult);

        //结果判断
        if (cbHuCardKind != constData.CHK_NULL)
          return constData.WIK_LISTEN;
      }

      //还原处理
      cbCardIndexTemp[i]++;
    }

    return constData.WIK_NULL;
  }

  //杠牌分析
  AnalyseGangCard(cbCardIndex, WeaveItem, cbWeaveCount, GangCardResult) {
    //设置变量
    let cbActionMask = constData.WIK_NULL;
    //手上杠牌
    for (let i = 0; i < constData.MAX_INDEX; i++) {
      if (cbCardIndex[i] == 4) {
        cbActionMask |= constData.WIK_GANG;
        GangCardResult.cbCardData[GangCardResult.cbCardCount] = constData.WIK_GANG;
        GangCardResult.cbCardData[GangCardResult.cbCardCount++] = this.SwitchToCardData(i);
      }
    }

    //组合杠牌
    for (let i = 0; i < cbWeaveCount; i++) {
      if (WeaveItem[i].cbWeaveKind == constData.WIK_PENG) {
        if (cbCardIndex[this.SwitchToCardIndex(WeaveItem[i].cbCenterCard)] == 1) {
          cbActionMask |= constData.WIK_GANG;
          GangCardResult.cbCardData[GangCardResult.cbCardCount] = constData.WIK_GANG;
          GangCardResult.cbCardData[GangCardResult.cbCardCount++] = WeaveItem[i].cbCenterCard;
        }
      }
    }

    return cbActionMask;
  }

  //吃胡分析
  AnalyseChiHuCard(cbCardIndex, WeaveItem, cbWeaveCount, cbCurrentCard, dwChiHuRight, ChiHuResult) {
    //变量定义
    let dwChiHuKind = constData.CHK_NULL;
    //   static CAnalyseItemArray AnalyseItemArray;
    let AnalyseItemArray = [];
    //设置变量
    //    AnalyseItemArray.RemoveAll();

    //构造扑克
    let cbCardIndexTemp = _.cloneDeep(cbCardIndex);

    //插入扑克
    if (cbCurrentCard != 0) {
      cbCardIndexTemp[this.SwitchToCardIndex(cbCurrentCard)]++;
    }

    //权位处理
    if ((cbCurrentCard != 0) && (cbWeaveCount == 4)) {
      dwChiHuRight |= constData.CHK_QUAN_QIU_REN;
    }
    //////////------------
    //分析扑克
    this.AnalyseCard(cbCardIndexTemp, WeaveItem, cbWeaveCount, AnalyseItemArray);

    //胡牌分析
    if (AnalyseItemArray.length > 0) {
      //牌型分析
      for (let i = 0; i < AnalyseItemArray.length; i++) {
        //变量定义
        let bLianCard = false, bPengCard = false;
        let pAnalyseItem = _.cloneDeep(AnalyseItemArray[i]);


        //牌型分析
        for (let j = 0; j < pAnalyseItem.cbWeaveKind.length; j++) {
          let cbWeaveKind = pAnalyseItem.cbWeaveKind[j];
          bPengCard = ((cbWeaveKind & (constData.WIK_GANG | constData.WIK_PENG)) != 0) ? true : bPengCard;
          bLianCard = ((cbWeaveKind & (constData.WIK_LEFT | constData.WIK_CENTER | constData.WIK_RIGHT)) != 0) ? true : bLianCard;
        }
        //碰碰牌型
        if ((bLianCard == false) && (bPengCard == true))
          dwChiHuKind |= constData.CHK_PENG_PENG;
        if ((bLianCard == true) && (bPengCard == true))
          dwChiHuKind |= constData.CHK_JI_HU;
        if ((bLianCard == true) && (bPengCard == false))
          dwChiHuKind |= constData.CHK_PING_HU;

      }
    }
    //牌权判断
    if (this.IsQingYiSe(cbCardIndexTemp, WeaveItem, cbWeaveCount) == true) dwChiHuRight |= constData.CHR_QING_YI_SE;

    //大胡牌型
    if (this.IsQiXiaoDui(cbCardIndexTemp, WeaveItem, cbWeaveCount) == true) dwChiHuKind |= constData.CHK_QI_XIAO_DUI;
    if (this.IsShiSanYao(cbCardIndexTemp, WeaveItem, cbWeaveCount) == true) dwChiHuKind |= constData.CHK_SHI_SAN_YAO;

    //结果判断
    if (dwChiHuKind != constData.CHK_NULL) {
      //变量定义
      let wGreatHuCount = 0;
      let dwGreatKind = dwChiHuKind & constData.CHK_MASK_GREAT;
      let dwGreatRight = dwChiHuRight & constData.CHR_MASK_GREAT;

      //番数统计
      for (let i = 0; i < 32; i++) {
        //设置变量
        dwGreatKind >>= 1;
        dwGreatRight >>= 1;

        //结果判断
        if ((dwGreatKind & 0x00000001) != 0) wGreatHuCount++;
        if ((dwGreatRight & 0x00000001) != 0) wGreatHuCount++;
      }

      //设置牌型
      ChiHuResult.dwChiHuKind = dwChiHuKind;
      ChiHuResult.dwChiHuRight = dwChiHuRight;

      //设置番数
      if (wGreatHuCount == 0) ChiHuResult.dwWinTimes = 1;
      else if (wGreatHuCount >= 1) ChiHuResult.dwWinTimes = 2;

      return constData.WIK_CHI_HU;
    }

    return constData.WIK_NULL;
  }
  //十三夭牌
  IsShiSanYao(cbCardIndex, WeaveItem, cbWeaveCount) {
    //组合判断
    if (cbWeaveCount != 0) return false;

    //扑克判断
    let bCardEye = false;

    //一九判断
    for (let i = 0; i < 27; i += 9) {
      //无效判断
      if (cbCardIndex[i] == 0) return false;
      if (cbCardIndex[i + 8] == 0) return false;

      //牌眼判断
      if ((bCardEye == false) && (cbCardIndex[i] == 2)) bCardEye = true;
      if ((bCardEye == false) && (cbCardIndex[i + 8] == 2)) bCardEye = true;
    }

    //番子判断
    for (let i = 27; i < constData.MAX_INDEX; i++) {
      if (cbCardIndex[i] == 0) return false;
      if ((bCardEye == false) && (cbCardIndex[i] == 2)) bCardEye = true;
    }

    //牌眼判断
    if (bCardEye == false) return false;

    return true;
  }

  //清一色牌
  IsQingYiSe(cbCardIndex, tagWeaveItem, cbItemCount) {
    //胡牌判断
    let cbCardColor = 0x00FF;

    for (let i = 0; i < constData.MAX_INDEX; i++) {
      if (cbCardIndex[i] != 0) {
        //花色判断
        if (cbCardColor != 0x00FF)
          return false;

        //设置花色
        cbCardColor = (this.SwitchToCardData(i) & constData.MASK_COLOR);

        //设置索引
        i = (Math.floor(i / 9) + 1) * 9 - 1;
      }
    }

    //组合判断
    for (let i = 0; i < cbItemCount; i++) {
      let cbCenterCard = tagWeaveItem[i].cbCenterCard;
      if ((cbCenterCard & constData.MASK_COLOR) != cbCardColor)
        return false;
    }

    return true;
  }
  //七小对牌
  IsQiXiaoDui(cbCardIndex, tagWeaveItem, cbWeaveCount) {
    //组合判断
    if (cbWeaveCount != 0)
      return false;

    //扑克判断
    for (let i = 0; i < constData.MAX_INDEX; i++) {
      let cbCardCount = cbCardIndex[i];
      if ((cbCardCount != 0) && (cbCardCount != 2) && (cbCardCount != 4))
        return false;
    }

    return true;
  }


  //扑克转换
  SwitchToCardData(cbCardIndex) {
    if (cbCardIndex >= 42) return 0;

    if (cbCardIndex >= 34 && cbCardIndex < 42)
      return (Define.COLOR_HUA << 4) | (cbCardIndex - 34 + 1);
    else
      return ((Math.floor(cbCardIndex / 9)) << 4) | (cbCardIndex % 9 + 1);

  }

  //扑克转换
  SwitchToCardIndex(cbCardData) {

    cbCardData &= 0x00FF;
    if (!this.IsValidCard(cbCardData)) return 0;

    let color = (cbCardData & constData.MASK_COLOR) >> 4;
    let value = (cbCardData & constData.MASK_VALUE);
    if (color == Define.COLOR_WAN || color == Define.COLOR_TIAO || color == Define.COLOR_BING) {
      return color * 9 + value - 1;
    }
    else if (color == Define.COLOR_FENG_JIAN) {
      return Define.COLOR_FENG_JIAN * 9 + value - 1;
    }
    else {
      return 34 + value - 1;
    }

  }

  //扑克转换
  SwitchToCardData1(cbCardIndex, cbCardData) {
    //转换扑克
    let cbPosition = 0;
    for (let i = 0; i < constData.MAX_INDEX; i++) {
      if (cbCardIndex[i] != 0) {
        for (let j = 0; j < cbCardIndex[i]; j++) {
          cbCardData[cbPosition++] = this.SwitchToCardData(i);
        }
      }
    }

    return cbPosition;
  }

  //扑克转换
  SwitchToCardIndex1(cbCardData, cbCardCount, cbCardIndex) {
    //设置变量
    this._ZeroMemory(cbCardIndex, constData.MAX_INDEX);

    //转换扑克
    for (let i = 0; i < cbCardCount; i++) {
      if (0 == this.SwitchToCardIndex(cbCardData[i])) {
        logger.info("ccccccccccccccccccc:" + i + ":" + cbCardData[i])
      };
      cbCardIndex[this.SwitchToCardIndex(cbCardData[i])]++;
    }

    return cbCardCount;
  }

  //分析扑克
  AnalyseCard(cbCardIndex, tagWeaveItem, cbWeaveCount, AnalyseItemArray) {
    //计算数目
    let cbCardCount = 0;
    for (let i = 0; i < constData.MAX_INDEX; i++)
      cbCardCount += cbCardIndex[i];
    //效验数目
    if ((cbCardCount < 2) || (cbCardCount > constData.MAX_COUNT) || ((cbCardCount - 2) % 3 != 0))
      return false;

    //变量定义
    let cbKindItemCount = 0;
    let KindItem = [];
    for (let i = 0; i < constData.MAX_COUNT - 2; i++) {
      KindItem.push(new tagKindItem());
    }

    //需求判断
    let cbLessKindItem = parseInt((cbCardCount - 2) / 3);

    //单吊判断
    if (cbLessKindItem == 0) {
      //效验参数
      //        ASSERT((cbCardCount==2)&&(cbWeaveCount==4));

      //牌眼判断
      for (let i = 0; i < constData.MAX_INDEX; i++) {
        if (cbCardIndex[i] == 2) {
          //变量定义
          let AnalyseItem = new tagAnalyseItem();

          //设置结果
          for (let j = 0; j < cbWeaveCount; j++) {
            AnalyseItem.cbWeaveKind[j] = tagWeaveItem[j].cbWeaveKind;
            AnalyseItem.cbCenterCard[j] = tagWeaveItem[j].cbCenterCard;
          }
          AnalyseItem.cbCardEye = this.SwitchToCardData(i);

          //插入结果
          AnalyseItemArray.push(AnalyseItem);

          return true;
        }
      }

      return false;
    }

    //拆分分析
    if (cbCardCount >= 3) {
      for (let i = 0; i < constData.MAX_INDEX; i++) {
        //同牌判断
        if (cbCardIndex[i] >= 3) {
          KindItem[cbKindItemCount].cbCardIndex[0] = i;
          KindItem[cbKindItemCount].cbCardIndex[1] = i;
          KindItem[cbKindItemCount].cbCardIndex[2] = i;
          KindItem[cbKindItemCount].cbWeaveKind = constData.WIK_PENG;
          KindItem[cbKindItemCount++].cbCenterCard = this.SwitchToCardData(i);
        }

        //连牌判断
        if ((i < (constData.MAX_INDEX - 9)) && (cbCardIndex[i] > 0) && ((i % 9) < 7)) {
          for (let j = 1; j <= cbCardIndex[i]; j++) {
            if ((cbCardIndex[i + 1] >= j) && (cbCardIndex[i + 2] >= j)) {
              KindItem[cbKindItemCount].cbCardIndex[0] = i;
              KindItem[cbKindItemCount].cbCardIndex[1] = i + 1;
              KindItem[cbKindItemCount].cbCardIndex[2] = i + 2;
              KindItem[cbKindItemCount].cbWeaveKind = constData.WIK_LEFT;
              KindItem[cbKindItemCount++].cbCenterCard = this.SwitchToCardData(i);
            }
          }
        }
      }
    }
    //组合分析
    if (cbKindItemCount >= cbLessKindItem) {
      //变量定义
      let cbCardIndexTemp = [];
      this._ZeroMemory(cbCardIndexTemp, constData.MAX_INDEX);

      //变量定义
      let cbIndex = [0, 1, 2, 3];
      let pKindItem = [];

      for (let i = 0; i < 4; i++) {
        pKindItem.push(new tagKindItem());
      }
      //开始组合
      do {
        cbCardIndexTemp = _.cloneDeep(cbCardIndex);
        //设置变量
        for (let i = 0; i < cbLessKindItem; i++)
          pKindItem[i] = _.cloneDeep(KindItem[cbIndex[i]]);
        //数量判断
        let bEnoughCard = true;
        for (let i = 0; i < cbLessKindItem * 3; i++) {
          //存在判断
          let _cbCardIndex = pKindItem[Math.floor(i / 3)].cbCardIndex[i % 3];
          if (cbCardIndexTemp[_cbCardIndex] == 0) {
            bEnoughCard = false;
            break;
          }
          else
            cbCardIndexTemp[_cbCardIndex]--;
        }
        //胡牌判断
        if (bEnoughCard == true) {
          //牌眼判断
          let cbCardEye = 0;
          for (let i = 0; i < constData.MAX_INDEX; i++) {
            if (cbCardIndexTemp[i] == 2) {
              cbCardEye = this.SwitchToCardData(i);
              break;
            }
          }
          //组合类型
          if (cbCardEye != 0) {
            //变量定义
            let AnalyseItem = new tagAnalyseItem();
            //设置组合
            for (let i = 0; i < cbWeaveCount; i++) {
              AnalyseItem.cbWeaveKind[i] = tagWeaveItem[i].cbWeaveKind;
              AnalyseItem.cbCenterCard[i] = tagWeaveItem[i].cbCenterCard;
            }

            //设置牌型
            for (let i = 0; i < cbLessKindItem; i++) {
              AnalyseItem.cbWeaveKind[i + cbWeaveCount] = pKindItem[i].cbWeaveKind;
              AnalyseItem.cbCenterCard[i + cbWeaveCount] = pKindItem[i].cbCenterCard;
            }

            //设置牌眼
            AnalyseItem.cbCardEye = cbCardEye;

            //插入结果
            AnalyseItemArray.push(AnalyseItem);
          }
        }
        //设置索引
        if (cbIndex[cbLessKindItem - 1] == (cbKindItemCount - 1)) {
          for (let i = cbLessKindItem - 1; i > 0; i--) {
            if ((cbIndex[i - 1] + 1) != cbIndex[i]) {
              let cbNewIndex = cbIndex[i - 1];
              for (let j = (i - 1); j < cbLessKindItem; j++)
                cbIndex[j] = cbNewIndex + j - i + 2;
              break;
            }
          }
          if (i == 0)
            break;
        }
        else
          cbIndex[cbLessKindItem - 1]++;

      } while (true);

    }
    return (AnalyseItemArray.length > 0);
  }

  //设置混牌
  SetHunCard(cbCardIndex) {
    this.m_cbHunCard = this.SwitchToCardData(cbCardIndex);
  }

  //清空混牌
  ClearHunCard() {
    this.m_cbHunCard = 0;
  }
};


//////////////////////////////////////////////////////////////////////////

module.exports = {
  MJApi,
  tagKindItem,
  tagWeaveItem,
  tagChiHuResult,
  tagGangCardResult,
  tagAnalyseItem
};
