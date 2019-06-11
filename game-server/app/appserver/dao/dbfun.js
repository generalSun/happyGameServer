const dbconnect = require('./dbconnect');
const Promise = require('bluebird');
const logger = require('pomelo-logger').getLogger('common');
const REASON = require('../../util/common').REASON;
class dbFun extends dbconnect{
  constructor() {
    super();
  }
  
  /**
   * 更新玩家数据库
   * @param {*} uid 
   * @param {*} content 
   * @param {*} reason 
   * @param {*} needPush 
   * @param {*} desc 
   * @param {*} emailText 
   */
  updateUser(uid, content, reason = REASON.BT_UNKNOW, needPush = false, desc = '', emailText = '') {
    let afterUpdate = {};
    return this.user.findOne({ where: { uid } })
      .then((result) => {
        if (!result) {
          return Promise.reject({
            code: -500,
            msg: "未找到用户信息"
          });
        }
        if (content.nick) {
          result.nick = content.nick;
          afterUpdate['nick'] = result.nick;
        }
        if (content.password) {
          result.password = content.password;
          afterUpdate['password'] = result.password;
        }
        if (content.score) {
          result.score += content.score;
          afterUpdate['score'] = result.score;
        }
        if (content.win) {
          result.win += content.win;
          afterUpdate['win'] = result.win;
        }
        if (content.lose) {
          result.lose += content.lose;
          afterUpdate['lose'] = result.lose;
        }
        if (content.role) {
          result.role = content.role;
          afterUpdate['role'] = result.role;
        }
        if (content.gold) {
          result.gold += content.gold;
          afterUpdate['gold'] = result.gold;
        }
        if (content.bean) {
          result.bean += content.bean;
          afterUpdate['bean'] = result.bean;
        }
        if (content.sex) {
          result.sex = content.sex;
          afterUpdate['sex'] = result.sex;
        }
        if (content.isOnline) {
          result.isOnline = content.isOnline;
          afterUpdate['isOnline'] = result.isOnline;
        }
        if (content.device) {
          result.device = content.device;
          afterUpdate['device'] = result.device;
        }
        if (content.mobile) {
          result.mobile = content.mobile;
          afterUpdate['mobile'] = result.mobile;
        }
        return result.save();
      })
      .catch((error) => {
        logger.error('updateUser error', uid, content, reason, error);
        if (error.code != -500) {
          error = { code: -500, msg: '信息更新失败' };
        }
        return Promise.reject(error);
      })
  }
}
module.exports = new dbFun();