const logger = require('pomelo-logger').getLogger('connect');
const common = require('../../../util/common');
const pomelo = require('pomelo');
class RoomRemote {
  constructor() {
  }
  kick(uid, sid, roomId, cb) {
    logger.info(`in ${pomelo.app.serverId} kick ${uid} sid:${sid}`);
    return pomelo.app.service.leaveRoom(roomId, uid, true)
      .then(() => {
        cb(null, { code: 200 });
      })
      .catch((error) => {
        logger.error('remote kick error baseremote', { error, uid, sid });
        cb(error, { code: 9999 });
      });
   }
}
module.exports = new RoomRemote();