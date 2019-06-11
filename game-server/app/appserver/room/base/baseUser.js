/**
 * create by wm 2019-3-20
 * 房间内玩家基类
 */
const baseUser =require('../../base/baseUser');
const GAMESTATE =require('../../../util/common');
class user extends baseUser{
  constructor(){
    super();
    this.trust = 0;
    this.online = 0;
    this.state = GAMESTATE.FREE;
    this.sid = null;
    this.handCards = [];               //手牌
    this.outCards = [];            //已出手牌
    this.chiPengGang = [];              //吃碰杠列表
    this.huapai = [];
    this.isTing = 0;                // 玩家当前处于听状态
  };

  /**
   * 清理玩家信息
   */
  clearUserInfo() {
    this.handCards = [];               //手牌
    this.outCards = [];            //已出手牌
    this.chiPengGang = [];              //吃碰杠列表
    this.huapai = [];
    this.isTing = 0;  
  };

  /**
   * 初始化玩家信息
   * @param {*} dbuser 
   */
  initUser(dbuser) {
    for (let key in this) {
      if (dbuser[key]) {
        this[key] = dbuser[key];
      }
    }
  };

  /**
   * 进桌获取玩家信息
   * @param {*} uid 
   */
  getPlayInfo(uid = null) {
    return {
      uid: this.uid,
      nick: this.nick,
      role: this.role,
      score: this.score,
      sex: this.sex,
      trust: this.trust,
      online: this.online,
      chair: this.chair,
      outCards: this.outCards,
      chiPengGang: this.chiPengGang,
      huapai: this.huapai,
      handCards: (this.uid == uid ? this.handCards : [])
    }
  }

  /**
   * 是否在游戏中
   */
  isPlaying() {
    if(this.isReady() || this.isFree()){
      return false;
    }
    return true;
  }

  /**
   * 设置游戏中状态
   */
  setRun() {
    this.state = GAMESTATE.RUN;
  }
  /**
   * 自由状态
   */
  isFree() {
    if (this.state == GAMESTATE.FREE) {
      return true;
    }
    return false;
  }
  setFree() {
    this.state = GAMESTATE.FREE;
  }
  /**
   * 准备状态
   */
  isReady() {
    if (this.state == GAMESTATE.READY) {
      return true;
    }
    return false;
  }
  setReady() {
    this.state = GAMESTATE.READY;
  }
  // 设置补花
  setBuHua() {
    this.state = GAMESTATE.BUHUA;
  }

  /**
   * 是否可以离开
   */
  canLeave(){
    if(this.isReady() || this.isFree()){
      return true;
    }
    return false;
  }

  setTrust(bool){
    this.trust = bool;
  }

  isNotNormal(){
    return this.trust || !this.online;
  }

  isOnline(){
    return this.online;
  }
  setOnline(b){
    this.online = b;
  }
}

module.exports = user;