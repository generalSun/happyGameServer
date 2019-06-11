const pomelo = require('pomelo');
const Promise = require('bluebird');
const TIMER_ID = require('../../../util/common').TIMER_ID;
const common = require('../../../util/common');
const api = require('./base/api');
const Define = require('./base/commonDefine');
const constData = require('./base/constData');
const CJudgeDecorator = require('./JudgeDecorator');
const START_COUNT = 4;
class table {
  constructor() {}
  init(tableIdx, roomInfo) {
    this.tableIdx = tableIdx;
    let info = roomInfo.info;
    this.outTime = info.outTime || 30;
    this.buhuaTime = info.buhuaTime || 5;
    this.readyTime = info.readyTime || 30;
    this.baseBean = info.baseBean || 10;
    this.enterLimit = info.enterLimit || 0;
    this.fee = info.fee || this.baseBean;
    this.roomId = roomInfo.id;
    this.timerNameReady = `timerNameReady${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;
    this.timerNameOutCard = `timerNameOutCard${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;
    this.timerNameTrustee = `timerNameTrustee${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;
    this.timerNameOffline = `timerNameOffline${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;
    this.timerNameEndToContinue = `timerNameEndToContinue${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;
    this.timerDelayCleanEnd = `timerDelayCleanEnd${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;
    this.timerNameBuHua = `timerNameBuHua${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;
    let nowtime = new Date().getTime();
    this.channel = pomelo.app.get('channelService').getChannel(`room_${this.roomId}_table_${this.tableIdx}_${nowtime}`, true);
    this.unreadyKickTime = {};
    this.mapUserInfo = {};
    this.clockTime = 0;
    this.api = new api.MJApi();
    this.lastOpOutChair = -1;
    this.curChair = -1;
    /////////////////////////////////////
    //游戏变量
    this.m_wSiceCount = [-1, -1]; //骰子点数
    this.m_wBankerUser = 0; //庄家用户
    this.m_lGameScore = []; //游戏得分
    this.m_cbCardIndex = []; //用户扑克

    this.m_cbHuaPaiCardData = [
      [],
      [],
      [],
      []
    ]; //玩家拥有的花牌
    this.m_cbHuaPaiCount = [0, 0, 0, 0]; //玩家的花牌数
    this.m_cbFinishBuHuaCount = 0; //完成补花的人数

    //出牌信息
    this.m_wOutCardUser = ""; //出牌用户
    this.m_cbOutCardData = 0; //出牌扑克
    this.m_cbOutCardCount = 0; //出牌数目
    this.m_cbDiscardCount = []; //丢弃数目
    this.m_cbDiscardCard = []; //丢弃记录
    //发牌信息

    this.m_cbSendCardData = 0; //发牌扑克
    this.m_cbSendCardCount = 0; //发牌数目
    this.m_cbLeftCardCount = 0; //剩余数目

    this.m_nMenWind = [0, 1, 2, 3]; //门风。第一个人是庄家，东风是门风；第二个人本门风是南风；
    //第三个人(即庄家对面的人)本门风是西风；第四个人本门风是北风。
    //庄家变动时，门风也就相应随之变动。
    this.m_nQuanWind = 0; //圈风
    this.m_nCountInQuan = 0; //一圈里打的局数，

    this.m_cbRepertoryCard = []; //库存扑克

    //运行变量
    this.m_cbProvideCard = 0; //供应扑克
    this.m_wResumeUser = -1; //还原用户
    this.m_wProvideUser = -1; //供应用户
    //状态变量
    this.m_bSendStatus = false; //发牌状态
    this.m_bGangStatus = false; //抢杆状态
    this.m_bEnjoinChiHu = []; //禁止吃胡
    this.m_bEnjoinChiPeng = []; //禁止吃碰

    //用户状态

    this.m_bResponse = []; //响应标志
    this.m_cbUserAction = []; //用户动作
    this.m_cbOperateCard = []; //操作扑克
    this.m_cbPerformAction = []; //执行动作
    //组合扑克
    this.m_cbWeaveItemCount = []; //组合数目
    this.m_WeaveItemArray = []; //组合扑克
    //结束信息
    this.m_cbChiHuCard = 0; //吃胡扑克
    this.m_ChiHuResult = []; //吃胡结果
    this.m_tianhumark = true; //天胡标志
    this.m_dihumark = true;
    /////////////////////////////////////
    this.m_pJudgeDecorator = null; //判断包装对象，用于进行吃、碰、杠、和的逻辑判断
    this.m_Hun = 0;
  }
  /**
   * 玩家上座
   * @param {*} chair 椅子
   * @param {*} user  用户信息
   */
  enterTable(chair, user) {
    if (this.getUserCount() >= 4 || this.getUserByChair(chair)) {
      return Promise.reject(new Error({
        code: -500,
        msg: '座位上已有人了'
      }));
    }
    if (user.bean < this.enterLimit) {
      return Promise.reject(new Error({
        code: -500,
        msg: `本桌准入标准是${this.enterLimit}钻石,请先去商城兑换`
      }));
    }
    user.chair = chair;
    this.mapUserInfo[user.uid] = user;
    let tableinfo = this.getEnterTableInfo(user.uid);
    this.tellOthersSomeOneIn(user);
    common.addToChannel(this.channel, user.uid, user.sid);
    return Promise.resolve(tableinfo);
  }

  /**
   * 某人上座后告诉桌上玩家和房间内玩家他上了哪个座位
   * @param {*} user 
   */
  tellOthersSomeOneIn(user) {
    let userInfo = user.getPlayInfo();
    this.channel.pushMessage('onPlayerIn', {
      userInfo
    }); // 给桌上的玩家推送玩家上座消息
    let baseInfo = {
      tableIdx: this.tableIdx,
      chair: user.chair,
      role: user.role,
      role: user.nick,
      roomId: this.roomId
    };
    pomelo.app.service.tellOthersSomeOneToTalbe(this.roomId, baseInfo);
  }

  /**
   * 某人离开座位后告诉桌上玩家和房间内玩家
   * @param {*} user 
   */
  tellOthersSomeOneOut(uid) {
    this.channel.pushMessage('onPlayerOut', {
      uid,
      roomId: this.roomId
    }); // 给桌上的玩家推送玩家离开消息
    let baseInfo = {
      tableIdx: this.tableIdx,
      uid,
      roomId: this.roomId
    };
    pomelo.app.service.tellOthersSomeOneLeaveTalbe(this.roomId, baseInfo);
  }

  /**
   * 某人离开桌子
   * @param {*} uid 
   */
  leaveTable(uid) {
    let user = this.mapUserInfo[uid];
    if (user && !user.isPlaying()) {
      this.tellOthersSomeOneOut(uid);
      common.leaveChannel(this.channel, user.uid);
      delete this.mapUserInfo[uid];
      delete pomelo.app.service.mapUserTable[uid];
    }
    // 有人离开需要清理桌子
    this.closeTimer(TIMER_ID.ID_READY, uid);
    this.closeTimer(TIMER_ID.ID_OFFLINE_KCIK, uid);
  }

  /**
   * 获取桌上人数
   */
  getUserCount() {
    return Object.keys(this.mapUserInfo).length;
  }

  /**
   * 获取准备人数
   */
  getReadyCount() {
    let count = 0;
    for (let key in this.mapUserInfo) {
      if (this.mapUserInfo[key].isReady()) {
        count++;
      }
    }
    return count;
  }

  /**
   * 通过椅子号查找玩家
   * @param {*} chair 
   */
  getUserByChair(chair) {
    for (let key in this.mapUserInfo) {
      if (this.mapUserInfo[key].chair == chair) {
        return this.mapUserInfo[key];
      }
    }
    return null;
  }

  /**
   * 获取桌子简要信息
   */
  getBasicTableInfo() {
    let info = {
      tableIdx: this.tableIdx,
      enterLimit: this.enterLimit,
      baseBean: this.baseBean,
      mapUserInfo: {}
    }
    for (let key in this.mapUserInfo) {
      info.mapUserInfo["role"] = this.mapUserInfo["role"];
      info.mapUserInfo["nick"] = this.mapUserInfo["nick"];
      info.mapUserInfo["chair"] = this.mapUserInfo["chair"];
    }
    return info;
  }

  /**
   * 玩家上座获取桌子基础信息
   */
  getEnterTableInfo(uid) {
    let info = {
      tableIdx: this.tableIdx,
      outTime: this.outTime,
      readyTime: this.readyTime,
      baseBean: this.baseBean,
      fee: this.fee,
      mapUserInfo: {}
    }
    for (let key in this.mapUserInfo) {
      info.mapUserInfo[key] = this.mapUserInfo[key].getPlayInfo(uid);
    }
    return info;
  }

  /**
   * 启动定时器
   * @param {Number} timerId	定时器ID
   * @param {Number} uid 用户ID
   */
  startTimer(timerId, uid = 0) {
    let self = this;
    switch (timerId) {
      case TIMER_ID.ID_OUT_CARD: // 出牌定时器
        this.clockTime = new Date().getTime() + this.outTime * 1000;
        common.setGameTimeout(this.timerNameOutCard, (this.outTime + 1) * 1000, () => {});
        break;
      case TIMER_ID.ID_BUHUA: // 补花定时器
        this.clockTime = new Date().getTime() + this.buhuaTime * 1000;
        common.setGameTimeout(this.timerNameBuHua, (this.buhuaTime + 1) * 1000, () => {
          let vrUserInfo = [];
          let mark = false;
          for (let key in this.mapUserInfo) {
            if (this.havehua(key)) {
              this.BuHua(key);
            }
          }
          this.toAllRun();
          this.m_bSendStatus = true;
          this.DispatchCardData(this.curChair);
        });
        break;
      case TIMER_ID.ID_TRUSTEE: // 托管延时操作定时器
        common.setGameTimeout(this.timerNameTrustee, 1000, () => {});
        break;
      case TIMER_ID.ID_READY: // 准备倒计时
        let tmpTimerName = this.timerNameReady + uid;
        this.unreadyKickTime[uid] = new Date().getTime();
        common.setGameTimeout(tmpTimerName, (this.readyTime + 1) * 1000, () => {
          let user = this.mapUserInfo[uid];
          if (user && user.isFree()) {
            this.leaveTable(user.uid);
          }
        });
        break;
      case TIMER_ID.ID_OFFLINE_KCIK: // 掉线提出定时器
        let timerNameOffline = this.timerNameOffline + uid;
        common.setGameTimeout(timerNameOffline, 3 * 60 * 1000, () => {
          let user = this.mapUserInfo[uid];
          if (user && !user.online && !user.isPlaying()) {
            let uid = user.uid;
            this.leaveTable(uid);
            pomelo.app.service.leaveRoom(this.roomId, uid);
          }
        });
        break;
      case TIMER_ID.END_TO_CONTINUE: // 一局结束到下一句开始
        common.setGameTimeout(this.timerNameEndToContinue, 35 * 1000, () => {});
        break;
      case TIMER_ID.DELAY_TO_CLEANEND: // 一局结束延时清理结算
        common.setGameTimeout(this.timerDelayCleanEnd, 100, () => {});
        break;
    }
  };

  /**
   * 关闭定时器
   */
  closeTimers() {
    for (let key in this.mapUserInfo) {
      this.closeTimer(TIMER_ID.ID_READY, key);
      this.closeTimer(TIMER_ID.ID_OFFLINE_KCIK, key);
    }
    this.closeTimer(TIMER_ID.ID_TRUSTEE);
    this.closeTimer(TIMER_ID.ID_OUT_CARD);
    this.closeTimer(TIMER_ID.ID_END_TO_CONTINUE);
    this.closeTimer(TIMER_ID.ID_FIRST_OUT_CARD);
    this.closeTimer(TIMER_ID.ID_DELAY_TO_CLEANEND);
    this.closeTimer(TIMER_ID.ID_BUHUA);
  }

  /**
   * 关闭定时器
   * @param {Number} timerId		定时器Id
   * @param {Number} uid    玩家ID
   */
  closeTimer(timerId, uid) {
    switch (timerId) {
      case TIMER_ID.ID_TRUSTEE: // 托管
        common.clearGameTimeout(this.timerNameTrustee);
        break;
      case TIMER_ID.ID_READY: // 准备定时器
        if (this.unreadyKickTime[uid]) {
          delete this.unreadyKickTime[uid]
        };
        common.clearGameTimeout(this.timerNameReady + uid);
        break;
      case TIMER_ID.ID_OUT_CARD: // 出牌
        this.clockTime = 0;
        common.clearGameTimeout(this.timerNameOutCard);
        break;
      case TIMER_ID.ID_OFFLINE_KCIK: // 掉线清理定时器
        common.clearGameTimeout(this.timerNameOffline + uid);
        break;
      case TIMER_ID.ID_END_TO_CONTINUE: // 一局结束到自动开始定时器
        this.clockTime = 0;
        common.clearGameTimeout(this.timerNameEndToContinue);
        break;
      case TIMER_ID.ID_DELAY_TO_CLEANEND: // 一局结束延时清理结算
        this.clockTime = 0;
        common.clearGameTimeout(this.timerDelayCleanEnd);
        break;
      case TIMER_ID.ID_BUHUA: // 补花
        this.clockTime = 0;
        common.clearGameTimeout(this.timerNameBuHua);
        break;
    }
  }

  /**
   * 当前是否可以离开桌子
   */
  canLeave() {
    if (this.getUserCount() < 4) {
      return true;
    }
    for (let key in this.mapUserInfo) {
      if (this.mapUserInfo[key].isPlaying()) {
        return false;
      }
    }
    return true;
  }

  /**
   * 桌上玩家准备
   * @param {*} uid 
   */
  onReady(uid, cb) {
    this.closeTimer(TIMER_ID.ID_READY, uid);
    let user = this.mapUserInfo[uid];
    if (user.isReady()) {
      return cb({
        code: 200
      });
    }
    if (user.isPlaying()) {
      return cb({
        code: 500
      });
    }
    user.setReady();
    this.channel.pushMessage('onReady', {
      uid
    }); // 给桌上的玩家推送玩家准备消息
    cb({
      code: 200
    });
    this.checkStart();
  }

  /**
   * 检查是否可以开始
   */
  checkStart() {
    if (this.getReadyCount() == 4) {
      this.onGameStart();
    }
  }

  //手牌中有花
  havehua(uid) {
    if (this.mapUserInfo[uid]) {
      for (let i = 0; i < this.mapUserInfo[uid].vrHandCard.length; i++) {
        if (this.api.IsHua(this.mapUserInfo[uid].vrHandCard[i])) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 补花
   */
  BuHua(uid) {
    //保存花牌，将花牌从手中移除，从牌堆中摸相应数量的牌
    let count = 0; //花牌数量（等于玩家需要的正常牌数量）
    let user = this.mapUserInfo[uid];
    let chair = user.chair;
    let len = user.vrHandCard.length;
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < user.vrHandCard.length; j++) {
        if (this.api.IsHua(user.vrHandCard[j])) {
          //保存花牌
          this.m_cbHuaPaiCardData[chair].push(user.vrHandCard[j]);
          this.m_cbHuaPaiCount[chair]++;

          //需要摸的牌数量
          ++count;
          //移除花牌
          user.huapai.push(user.vrHandCard[j]);
          user.vrHandCard.splice(j, 1);
          break;
        }
      }
    }

    //从牌堆中再摸牌
    if (count > 0) {
      let cardlist = [];
      let cardCount = 0; //已经摸到的正常牌数量
      for (let i = 0; i < count; i++) {
        if (this.m_cbRepertoryCard.length <= 0) return 0; //如果牌不够了，返回0，表示没有摸到正常牌
        let cbCardData = this.m_cbRepertoryCard[0];
        cardlist.push(cbCardData);
        this.m_cbRepertoryCard.splice(0, 1);
        user.vrHandCard.push(cbCardData);
      }
      /////
      let buhua = {
        uid: user.uid,
        huacount: count,
        buhuacardlist: cardlist,
        HuaPaiCardData: this.m_cbHuaPaiCardData[chair],
        HuaPaiCount: this.m_cbHuaPaiCount[chair]
      }
      //将补花数据发给玩家
      this.channel.pushMessage("on_BUHUA", buhua);
      /////
      for (let h = 0; h < user.vrHandCard.length; h++) {
        if (this.api.IsHua(user.vrHandCard[h])) {
          this.BuHua(user.uid);
          return cardCount;
        }
      }
      return cardCount;
    }
    return 0;
  }

  //补花后游戏开始发牌给庄家
  DispatchCardafterbuhua() {
    for (let key in this.mapUserInfo) {
      if (this.havehua(key)) {
        return false;
      }
    }
    for (let key in this.mapUserInfo) {
      this.mapUserInfo[key].setRun();
    }
    this.m_bSendStatus = true;
    this.DispatchCardData(this.curChair);
    return true;
  }


  /**
   * 发牌
   * @param {*} uid 
   * @param {*} b 
   */
  DispatchCardData(curChair, b = false) {
    //荒庄结束
    if (this.m_cbRepertoryCard.length <= 0) {
      this.m_cbChiHuCard = 0;
      this.m_wProvideUser = -1;
      this.onGameEnd(this.m_wProvideUser, "", 1); ///////////////////////////////////////////////
      return true;
    }
    let user = this.getUserByChair(curChair);
    //设置变量
    this.m_cbOutCardData = 0;
    this.curChair = curchair;
    this.m_wOutCardUser = -1;
    this.m_bEnjoinChiHu[curchair] = false;

    //发牌处理
    //发送扑克
    this.m_cbSendCardCount++;
    this.m_cbSendCardData = this.m_cbRepertoryCard[0];
    this.m_cbRepertoryCard.splice(0, 1);
    user.vrHandCard.push(this.m_cbSendCardData);
    if (this.api.IsHua(this.m_cbSendCardData)) {
      return this.BuHua(user.uid);
    }

    //设置变量
    this.m_wProvideUser = curchair;
    this.m_cbProvideCard = this.m_cbSendCardData;

    //杠牌判断
    // 杠牌和自摸不管什么时候都要检测
    //if ((!this.m_bEnjoinChiPeng[curchair])&&(this.m_cbRepertoryCard.length>1))
    //{
    //    let GangCardResult=new tagGangCardResult();
    //    this.m_cbUserAction[curchair]|=this.api.AnalyseGangCard(this.SwitchToCardIndex(this.m_cbCardIndex[curchair]),
    //        this.m_WeaveItemArray[curchair],this.m_cbWeaveItemCount[curchair],GangCardResult);
    //}

    let nCheckMask = 0;
    nCheckMask |= Define.REQUEST_TYPE_GANG;
    let mahGroup = [];
    for (let l = 0; l < 5; l++) {

      mahGroup[l] = Judge.createSTONEGROUP();
    }
    let gangCount = this.m_pJudgeDecorator.CheckShowTile(this.SwitchToCardIndex(this.m_cbCardIndex[this.curChair]), Define.INVALID_CARD_INDEX, this.m_WeaveItemArray[this.curChair], this.m_cbWeaveItemCount[this.curChair],
      this.m_cbHuaPaiCardData[this.curChair], this.m_cbHuaPaiCount[this.curChair], nCheckMask, true, this.m_nMenWind[this.curChair], mahGroup);

    //将杠牌结果保存到原生的数据结构中
    if (gangCount > 0) {
      let GangCardResult = new tagGangCardResult();
      for (let i = 0; i < gangCount; ++i) {
        if (mahGroup[i].nGroupStyle == Define.GROUP_STYLE_ANGANG) {
          GangCardResult.cbCardData[GangCardResult.cbCardCount] = this.m_pJudgeDecorator.SwitchstoneToCardData(mahGroup[i].asStone[0]);
          ++GangCardResult.cbCardCount;
          this.m_cbUserAction[this.curChair] |= FKMJConstData.WIK_GANG;
        }
        else if (mahGroup[i].nGroupStyle == Define.GROUP_STYLE_MINGGANG) {
          this.m_bGangStatus = true;
          GangCardResult.cbCardData[GangCardResult.cbCardCount] = this.m_pJudgeDecorator.SwitchstoneToCardData(mahGroup[i].asStone[0]);
          ++GangCardResult.cbCardCount;
          this.m_cbUserAction[this.curChair] |= FKMJConstData.WIK_GANG;

        }
      }
    }
    //


    //牌型权位
    let dwChiHuRight = 0;
    if (this.m_bGangStatus) dwChiHuRight |= FKMJConstData.CHR_QIANG_GANG;
    ////
    //胡牌判断
    let ChiHuResult = new tagChiHuResult();
    let winmode = 0;
    if (this.m_cbSendCardCount <= 1 && this.m_tianhumark) {
      winmode |= Define.WIN_MODE_TIANHU;
    }
    if ((this.m_wBankerUser + this.m_cbSendCardCount - 1) % 4 == curchair && this.m_cbSendCardCount <= 4 && this.m_dihumark && this.m_wBankerUser != curchair) {
      winmode |= Define.FAN_DIHU;
    }

    winmode |= Define.WIN_MODE_ZIMO;
    if (this.m_cbRepertoryCard.length == 0) {
      winmode |= Define.WIN_MODE_HAIDI;
    }
    //let checkResult=0;
    let checkResult = this.m_pJudgeDecorator.CheckWin(this.SwitchToCardIndex(this.m_cbCardIndex[this.curChair]), this.api.SwitchToCardIndex(this.m_cbSendCardData), this.m_WeaveItemArray[this.curChair], this.m_cbWeaveItemCount[this.curChair],
      this.m_cbHuaPaiCardData[this.curChair], this.m_cbHuaPaiCount[this.curChair], winmode, this.m_nMenWind[this.curChair], ChiHuResult);
    if (checkResult == Define.F_NOENOUGHFANS || checkResult == Define.T_OK) this.m_cbUserAction[this.curChair] |= FKMJConstData.WIK_CHI_HU;

      //let ChiHuResult= new tagChiHuResult();
      //this.m_cbUserAction[curchair]|=this.api.AnalyseChiHuCard(this.SwitchToCardIndex(this.m_cbCardIndex[curchair]),
      //    this.m_WeaveItemArray[curchair],this.m_cbWeaveItemCount[curchair],0,dwChiHuRight,ChiHuResult);
    //构造数据
    let SendCard = {
      uid: user.uid,
      buhuamark: b,
      HuaPaiCardData: this.m_cbHuaPaiCardData[curchair],
      curchair: curchair,
      cbActionMask: this.m_cbUserAction[curchair],
      cbCardData: this.m_cbSendCardData
    }
    //发送一张牌给当前玩家数据
    let param = {
      route: "onFKMJ_SUB_S_SEND_CARD",
      msg: SendCard
    };

    let uids = [];
    this.getNotUidToUserAndLookUIDAll("", uids);
    common.sendTo(param, uids);


    let userInfo = this.getChairUser(this.curChair);
    if (userInfo.isServerTrust()) {
      this.zidongchupai();
    } else {
      this.setOutCardTime(true);
    }
    return true;
  }

  onGameStart() {
    this.closeTimers();
    this.repositTableFrameSink(true);
    for (let key in this.mapUserInfo) {
      this.mapUserInfo[key].setRun();
      this.mapUserInfo[key].clearUserInfo();
    }
    this.lastOpOutChair = -1;
    this.curChair = -1;
    this.m_cbRepertoryCard = [];

    //初始化
    this.m_cbProvideCard = 0;
    this.m_wProvideUser = -1;
    this.curChair = this.m_wBankerUser;
    this.m_cbHuaPaiCount = [0, 0, 0, 0];
    this.m_cbHuaPaiCardData = [[], [], [], []];
    let vrUserInfo = [];
    
    //设置圈风
    this.m_pJudgeDecorator.SetQuanWind(this.m_nQuanWind);

    //牌总数
    this.m_cbRepertoryCard = constData.deckCardList.slice();

    //洗牌
    for (let i = 0; i < 5; i++) {
      this.m_cbRepertoryCard.sort(function () { return 0.5 - Math.random() });
    }

    //确定混牌

    let index = Math.floor(Math.random()*100.0)% 34;
    this.m_Hun = this.api.SwitchToCardData(index);
    this.m_pJudgeDecorator.SetHun(this.m_Hun);

    //分发 每个玩家13张
    for (let key in this.mapUserInfo) {
      this.mapUserInfo[key].vrHandCard = this.m_cbRepertoryCard.splice(0, 13);
      this.mapUserInfo[key].setBuHua(); // 设置补花
    }

    ////fapai test
    //this.getUserByChair(0).vrHandCard=[0x01,0x01,0x01,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x37];
    //this.getUserByChair(0).vrHandCard=[0x26,0x27,0x28,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x37];
    //this.getUserByChair(0).vrHandCard=[0x01,0x01,0x01,0x01,0x04,0x07,0x12,0x15,0x18,0x23,0x26,0x29,0x37];//zuhelong
    //this.getUserByChair(0).vrHandCard=[0x31,0x32,0x33,0x34,0x31,0x32,0x33,0x34,0x31,0x32,0x33,0x34,0x36];//大四喜
    //this.getUserByChair(0).vrHandCard=[0x35,0x36,0x37,0x35,0x36,0x37,0x35,0x36,0x37,0x21,0x21,0x21,0x19];//大三元
    //this.getUserByChair(0).vrHandCard=[0x12,0x13,0x14,0x12,0x13,0x14,0x12,0x13,0x14,0x16,0x16,0x16,0x18];//绿一色
    //this.getUserByChair(0).vrHandCard=[0x11,0x11,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x19,0x19];//九莲宝灯
    //this.getUserByChair(0).vrHandCard=[0x11,0x11,0x12,0x12,0x13,0x13,0x14,0x14,0x15,0x15,0x16,0x16,0x17];//连七对
    //this.getUserByChair(0).vrHandCard=[0x11,0x19,0x01,0x09,0x21,0x29,0x31,0x32,0x33,0x34,0x35,0x36,0x37];//十三幺
    // this.getUserByChair(0).vrHandCard = [0x01, 0x02, 0x03, 0x12, 0x13, 0x14, 0x23, 0x24, 0x25, 0x14, 0x15, 0x16, 0x26];
    // this.getUserByChair(1).vrHandCard = [0x03, 0x03, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x11, 0x12, 0x13, 0x36];
    // this.getUserByChair(2).vrHandCard = [0x02, 0x02, 0x02, 0x05, 0x05, 0x06, 0x07, 0x08, 0x09, 0x11, 0x12, 0x13, 0x09];
    // this.getUserByChair(3).vrHandCard = [0x33, 0x02, 0x03, 0x04, 0x04, 0x06, 0x07, 0x08, 0x09, 0x11, 0x12, 0x13, 0x36];
    // this.m_cbRepertoryCard = [0x45,
    //   0x36, 0x09, 0x18, 0x17, 0x18, 0x19,						//索子
    //   0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						//索子
    //   0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						//索子
    //   0x14, 0x15, 0x16, 0x17, 0x18, 0x19,						//索子
    //   0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						//同子
    //   0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						//同子
    //   0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						//同子
    //   0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,						//同子
    //   0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,									//番子
    //   0x31, 0x32, 0x33, 0x34, 0x35,									//番子
    //   0x31, 0x32, 0x33, 0x34, 0x35,									//番子
    //   0x31, 0x32, 0x33, 0x34, 0x35, 0x37								//番子
    // ];

    //////


    //this.m_cbLeftCardCount = constData.deckCardList.length;

    //设置变量
    this.m_cbProvideCard = 0;
    this.m_wProvideUser = -1;
    for (let i = 0; i < 4; i++) {
      this.m_cbCardIndex[i] = this.getUserByChair(i).vrHandCard;
    }
    ////动作分析
    //let bAroseAction=false;
    //for (let i=0;i<START_COUNT;i++)
    //{
    //    //特殊胡牌
    //    //m_cbUserAction[i]|=m_GameLogic.EstimateChiHu(m_cbCardIndex[i]);
    //    //庄家判断
    //    if (i==this.m_wBankerUser)
    //    {
    //
    //        //杠牌判断
    //        let GangCardResult = new tagGangCardResult();
    //        this.m_cbUserAction[i]|=this.api.AnalyseGangCard(this.SwitchToCardIndex(this.m_cbCardIndex[i]),"",0,GangCardResult);
    //        //胡牌判断
    //        let ChiHuResult=new tagChiHuResult();
    //        this.m_cbUserAction[i]|=this.api.AnalyseChiHuCard(this.SwitchToCardIndex(this.m_cbCardIndex[i]),"",0,0,0,ChiHuResult);
    //    }
    //
    //    //状态设置
    //    if ((bAroseAction==false)&&(i!=this.m_wBankerUser)&&(this.m_cbUserAction[i]!=constData.WIK_NULL))
    //    {
    //        bAroseAction=true;
    //        this.m_wResumeUser=this.curChair;
    //        this.curChair=-1;
    //    }
    //}
    
    ////
    //开始打牌
    //this.setOutCardTime(true);

    //启动补花定时
    this.setBuHuaTime(true, this.buhuaertime, -100, false);
  }

  /**
   * 复位桌子
   * @param {*} iscontinue
   */
  repositTableFrameSink(iscontinue) {
    //游戏变量
    this.m_cbFinishBuHuaCount = 0;
    this.m_wSiceCount = [-1, -1];							//骰子点数
    if (undefined == iscontinue || !iscontinue) {
      for (let i = 0; i < 4; ++i) {
        this.m_nMenWind[i] = i;
      }
      this.m_wBankerUser = 0;							//庄家用户
      this.m_nQuanWind = Define.WIND_EAST;
    }
    this.m_lGameScore = [];				//游戏得分
    this.m_cbCardIndex = [];	//用户扑克
    //出牌信息
    this.m_wOutCardUser = "";							//出牌用户
    this.m_cbOutCardData = 0;						//出牌扑克
    this.m_cbOutCardCount = 0;						//出牌数目
    this.m_cbDiscardCount = [];			//丢弃数目
    for (let i = 0; i < START_COUNT; i++) {
      this.m_cbDiscardCount[i] = 0;
    }
    this.m_cbDiscardCard = [];
    this.m_cbDiscardCard = [START_COUNT][55];		//丢弃记录
    //发牌信息
    this.m_tianhumark = true;
    this.m_dihumark = true;
    this.m_cbSendCardData = 0;						//发牌扑克
    this.m_cbSendCardCount = 0;						//发牌数目
    this.m_cbLeftCardCount = 0;						//剩余数目
    this.m_cbRepertoryCard = [];//库存扑克
    for (let i = 0; i < constData.MAX_REPERTORY; i++) {
      this.m_cbRepertoryCard[i] = 0;
    }

    //运行变量
    this.m_cbProvideCard = 0;                         //供应扑克
    this.m_wResumeUser = -1;                          //还原用户
    this.m_wProvideUser = -1;                         //供应用户
    //状态变量
    this.m_bSendStatus = false;							//发牌状态
    this.m_bGangStatus = false;							//抢杆状态
    this.m_bEnjoinChiHu = [];//禁止吃胡
    for (let i = 0; i < START_COUNT; i++) {
      this.m_bEnjoinChiHu[i] = false;
    }

    this.m_bEnjoinChiPeng = [];	//禁止吃碰
    for (let i = 0; i < START_COUNT; i++) {
      this.m_bEnjoinChiPeng[i] = false;
    }

    //用户状态
    this.m_bResponse = [];				//响应标志
    this.m_cbUserAction = [];     //用户动作
    for (let i = 0; i < START_COUNT; i++) {
      this.m_cbUserAction[i] = constData.WIK_NULL;
    }
    this.m_cbOperateCard = [];//操作扑克
    for (let i = 0; i < START_COUNT; i++) {
      this.m_cbOperateCard[i] = 0;
    }
    this.m_cbPerformAction = [];
    for (let i = 0; i < START_COUNT; i++) {
      this.m_cbPerformAction[i] = 0;
    }
    //组合扑克
    this.m_cbWeaveItemCount = [];
    for (let i = 0; i < START_COUNT; i++) {
      this.m_cbWeaveItemCount[i] = 0;
    }
    this.m_WeaveItemArray = [];//组合扑克
    for (let i = 0; i < 4; i++) {
      this.m_WeaveItemArray[i] = [];
      for (let j = 0; j < 4; j++) {
        this.m_WeaveItemArray[i][j] = new api.tagWeaveItem();
      }

    }
    //结束信息
    this.m_cbChiHuCard = 0;							//吃胡扑克
    this.m_ChiHuResult = [];				//吃胡结果
    for (let j = 0; j < 4; j++) {
      this.m_ChiHuResult[j] = new api.tagChiHuResult();
    }
    this.m_pJudgeDecorator = new CJudgeDecorator(Define.RULE_PUBLIC);
    this.m_pJudgeDecorator.Init();
    /////////////////////////////////////
  }
}
module.exports = table;