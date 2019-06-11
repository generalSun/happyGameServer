/**
 * create by wm 2019-3-20
 * 桌子的基类
 */
const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger('common');
const common = require('../../../util/common');
const TIMER_ID = common.TIMER_ID;
class table {
  constructor(tableIdx, roomInfo) {
    this.userCount = roomInfo.userCount;
    this.tableIdx = tableIdx;
    let info = roomInfo.info;
    this.outTime = info.outTime || 20;                                //出牌时间
    this.buhuaTime = info.buhuaTime || 5;                             //补花时间
    this.operationTime = info.operationTime || 10;                    //操作时间
    this.readyTime = info.readyTime || 30;                            //准备时间
    this.baseBean = roomInfo.baseBean || 10;                            //底分
    this.enterLimit = roomInfo.enterLimit || 0;                           //准入值
    this.fee = roomInfo.fee || this.baseBean;                            //服务费
    this.roomId = roomInfo.id;                                        //房间id
    this.timerNameReady = `timerNameReady${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;          // 准备定时器名
    this.timerNameOutCard = `timerNameOutCard${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;      //出牌定时器名
    this.timerNameTrustee = `timerNameTrustee${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;      //托管定时器名
    this.timerNameOffline = `timerNameOffline${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;      //掉线定时器名
    this.timerNameEndToContinue = `timerNameEndToContinue${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;//一局结束下一句开始定时器名
    this.timerDelayCleanEnd = `timerDelayCleanEnd${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;  //延迟清理桌子定时器名
    this.timerNameBuHua = `timerNameBuHua${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;          //补花定时器名
    this.timerNameOperation = `timerNameOperator${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;          //吃碰杠等基础操作定时器名
    this.timerNameCheckTinghu = `timerNameCheckTinghu${this.roomId}_${tableIdx}_${pomelo.app.serverId}`;          //检查吃胡定时器
    let nowtime = new Date().getTime();
    this.channel = pomelo.app.get('channelService').getChannel(`room_${this.roomId}_table_${this.tableIdx}_${nowtime}`, true); //本桌消息channel
    this.mapUserInfo = {};
    this.clockTime = 0;
    this.allCards = []; //桌上的牌
    this.currentOutId = null;
    this.operatorClockTime = 0;   // 定时器开始计时时间戳
    this.unreadyKickTime = {};    // 未准备踢出倒计时{uid:time}
    this.mapUserOutTime = {};     // 可以出牌玩家轮到他出牌时间与uid的map
    this.usedTimer = [];          // 使用中的定时器
    this.lastOperator = null;     // 上个出牌玩家
    this.lastOperatorCard = null; // 上个出牌玩家出的拍牌
    this.operations = null;         // 玩家操作权位，比如玩家出8条 有人吃8条有人碰或杠8条有人胡8条，胡的权位大于吃碰大于杠
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
   * 获取除了指定玩家以外channel中的玩家
   * @param {*} uids 
   */
  getAllPersonExcept(uids) {
    let users = this.channel.getMembers();
    let result = [];
    for (let i = 0; i < users.length; i++) {
      if (uids.indexOf(users[i]) == -1) {
        result.push(this.channel.getMember(users[i]));
      }
    }
    return result;
  };

  /**
	 * 玩家是否可以离开
	 * @param {*} uid 
   * @param {*} force 玩家强制终止了游戏比如被kick 
	 */
  canLeave(uid, force = false) {
    if (!this.mapUserInfo[uid] || this.mapUserInfo[uid].canLeave()) {
      return true;
    }
    if (force) {
      common.leaveChannel(this.channel, uid);
      let user = this.mapUserInfo[uid];
      user.setOnline(false);
      this.channel.pushMessage("onUserOnline", { uid, online: false });
    }
    return false;
  }

  /**
   * 玩家托管或者取消托管
   * @param {*} uid 
   * @param {*} bool 
   */
  onTrust(uid, bool) {
    let user = this.mapUserInfo[uid];
    if (!user) {
      return false;
    }
    user.setTrust(bool);
    this.channel.pushMessage("onUserTrust", { uid, trust: bool });
    return true;
  }

  /**
   * 向指定用户发送消息
   * @param {*} msg 
   * @param {*} uid 
   */
  pushMsgByUid(msg, uid) {
    let uidInfo = {};
    uidInfo.uid = uid;
    uidInfo.sid = this.mapUserInfo[uid].sid;
    if (this.mapUserInfo[uid].online) {
      common.pushMsg(msg.route, msg.data, [uidInfo]);
    }
  };

  /**
   * 向除指定uid以外玩家发送消息
   * @param {*} msg 
   * @param {*} uid 
   */
  pushMsgExceptUid(msg, uid) {
    for (let key in this.mapUserInfo) {
      if (key != uid && this.mapUserInfo[uid].online) {
        let uidInfo = {};
        uidInfo.uid = key;
        uidInfo.sid = this.mapUserInfo[key].sid;
        common.pushMsg(msg.route, msg.data, [uidInfo]);
      }
    }

  };

  /**
   * 获取桌子简要信息
   */
  getBasicTableInfo() {
    let tableinfo = {};
    for (let key in this.mapUserInfo) {
      let info = {};
      info["uid"] = key;
      info["tableIdx"] = this.tableIdx;
      info["role"] = this.mapUserInfo[key]["role"];
      info["nick"] = this.mapUserInfo[key]["nick"];
      info["chair"] = this.mapUserInfo[key]["chair"];
      tableinfo[key] = info;
    }
    return tableinfo;
  }

  /**
   * 玩家上座的时候获取本桌的简要信息
   * @param {*} uid 
   */
  getEnterTableInfo(uid) {

  }

  /**
   * 玩家上座
   * @param {*} chair 椅子
   * @param {*} user  用户信息
   */
  enterTable(chair, user) {
    if (this.getUserCount() >= this.userCount || this.getUserByChair(chair)) {
      return Promise.reject({
        code: -500,
        msg: '座位上已有人了'
      });
    }
    if (user.bean < this.enterLimit) {
      return Promise.reject({
        code: -500,
        msg: `本桌准入标准是${this.enterLimit}豆子,您的豆子不足`
      });
    }
    if ((chair < 0 || chair > 3) || (this.userCount == 2 && !(chair == 0 || chair == 2))) {
      return Promise.reject({
        code: 500,
        msg: `错误的椅子号，${chair}`
      });
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
      uid: user.uid,
      tableIdx: this.tableIdx,
      chair: user.chair,
      role: user.role,
      nick: user.nick,
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
      tableIdx: this.tableIdx,
      roomId: this.roomId
    }); // 给桌上的玩家推送玩家离开消息
    let baseInfo = {
      tableIdx: this.tableIdx,
      uid,
      roomId: this.roomId
    };
    pomelo.app.service.tellOthersSomeOneLeaveTalbe(this.roomId, baseInfo);
  }

  closeTimer(timerId, userId) {}

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

}
module.exports = table;