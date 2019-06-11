const Promise = require('bluebird');
const pomelo = require('pomelo');
let baseUser = require('../../../appserver/base/baseUser');
const logger = require('pomelo-logger').getLogger('common');

class HallHandler{
	constructor() {}
	enterHall(msg, session, next) {
		if (!session.uid) {
			return next(null, { code: 500});
		}
		pomelo.app.service.enterHall(session)
			.then((result) => {
				return next(null, { code: 200, msg: result });
			})
			.catch((error) => {
				logger.error('enterHall error', error);
				error.code = error.code || -500;
				error.msg = error.msg || "进入大厅发生错误";
				return next(null, error);
		})
	}

	updateUserInfo(msg, session, next) {
		if (!session.uid) {
			return next(null, { code: 500});
		}
		if(!msg.upinfo){
			return next(null, { code: -500,msg:"参数不正确"});
		}
		pomelo.app.db.user.update(msg.upinfo, {
			where: {
				uid:session.uid
			}
		})
			.then((result) => {
				return next(null, { code: 200, msg: result });
			})
			.catch((error) => {
				logger.error('updateUserInfo error', error);
				error.code = error.code || -500;
				error.msg = error.msg || "更新信息出错";
				return next(null, error);
		})
	}
}
module.exports = new HallHandler();