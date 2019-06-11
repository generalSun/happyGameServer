const pomelo = require('pomelo');
let user = require("./speedMJ/speedMJUser");
const Promise = require('bluebird');
const common = require('../../util/common');
const logger = require('pomelo-logger').getLogger('connect');
class RoomServices {
  constructor() {
    this.rooms = {};  // 房间列表
    this.mapUserTable = {}; // 房间内用户与桌子map
    this.channels = {};
    this.mapUserRoom = {};
  }
  /**
   * 服务器启动的时候初始化桌子
   */
  initRoom() {
    pomelo.app.db.room.findAll({
      where: { visual: 1, serverId: pomelo.app.serverId }
    })
      .then((result) => {
        for (let i = 0; i < result.length; i++) {
          this.createTables(result[i]);
        }
      })
  }

  /**
   * 服务器启动的时候初始化桌子
   */
  createTables(roomInfo) {
    this.rooms[roomInfo.id] = [];
    let tableclass = require(roomInfo.tableClass);
    this.channels[roomInfo.id] = pomelo.app.get('channelService').getChannel(`room_${roomInfo.id}`, true);
    for (let i = 0; i < roomInfo.tableCount; i++) {
      let table = new tableclass(i, roomInfo);
      this.rooms[roomInfo.id].push(table);
    }
  }

  /**
   * 检查玩家是否在桌上
   * @param {*} uid 
   */
  checkOnTable(uid) {
    let table = this.mapUserTable[uid];
    if (table) {
      if (table.mapUserInfo[uid]) {
        return true;
      }
      delete this.mapUserTable[uid];
      return false
    }
    return false;
  }

  /**
   * 进入房间
   * @param {*} roomId 
   * @param {*} session 
   */
  enterRoom(roomId, session) {
    let tables = this.rooms[roomId];
    let table = [];
    for (let i = 0; i < tables.length; i++) {
      let tableinfo = tables[i].getBasicTableInfo();
      table.push(tableinfo);
    }
    let userStatus = {
      uid: session.uid,
      sid: session.get('sid'),
      gameType: pomelo.app.serverType,
      gameServerId: pomelo.app.serverId,
      status: 0,
      roomId: roomId
    };
    return pomelo.app.userStatus.setObj(userStatus)
      .then(() => {
        this.mapUserRoom[session.uid] = roomId;
        common.addToChannel(this.channels[roomId], session.uid, session.get('sid'));
        let members = this.channels[roomId].getMembers();
        return Promise.resolve({roomId,table});
      })
  }

  /**
   * 玩家离开房间
   * @param {*} roomId 
   * @param {*} uid 
   * @param {*} force 强制离开
   */
  leaveRoom(roomId, uid,force = false) {
    common.leaveChannel(this.channels[roomId], uid);
    if(this.mapUserTable[uid]){
      if(!this.mapUserTable[uid].canLeave(uid,force)){
        return Promise.reject({code:-500,msg:"游戏中无法离开"})
      }
      this.mapUserTable[uid].leaveTable(uid);
    }
    let userStatus = {
      uid: uid,
      gameType: null,
      gameServerId: null,
      status: 0,
      roomId: null
    };
    delete this.mapUserRoom[uid];
    return pomelo.app.userStatus.setObj(userStatus);
  }

  /**
   * 玩家上座
   * @param {*} tableidx 
   * @param {*} chair 
   * @param {*} session 
   */
  enterTable(tableidx, chair, session) {
    let roomId = this.mapUserRoom[session.uid];
    if (!roomId) {
      return Promise.reject({ code: 500, msg: '上座找不到房间' });
    }
    let table = this.rooms[roomId][tableidx];
    if (!table) {
      return Promise.reject({ code: -500, msg: '上座失败,找不到桌子' });
    }
    return pomelo.app.db.user.findOne({
      where: { uid: session.uid }
    })
      .then((result) => {
        if (!result) {
          return Promise.reject({ code: 500, msg: '找不到用户' });
        }
        let newUser = new user();
        newUser.initUser(result.dataValues);
        newUser.sid = session.get('sid');
        return table.enterTable(chair, newUser);
      })
      .then((result) => {
        common.leaveChannel(this.channels[roomId], session.uid);
        this.mapUserTable[session.uid] = table;
        return Promise.resolve(result);
      })
  }

  /**
   * 告诉房间内玩家某人上座
   */
  tellOthersSomeOneToTalbe(roomId, user) {
    let members = this.channels[roomId].getMembers();
    this.channels[roomId].pushMessage('onPlayerToTable', user);
  }
  /**
   * 告诉房间内玩家某人离开座位
   */
  tellOthersSomeOneLeaveTalbe(roomId, user) {
    let members = this.channels[roomId].getMembers();
    this.channels[roomId].pushMessage('onPlayerLeaveTable', user);
  }

  /**
   * 某人从桌子上返回房间
   * @param {*} roomId 
   * @param {*} uid 
   */
  backRoomFromTable(roomId, uid, sid) {
    delete this.mapUserTable[uid];
    common.addToChannel(this.channels[roomId], uid, sid);
  }
}
module.exports = new RoomServices();