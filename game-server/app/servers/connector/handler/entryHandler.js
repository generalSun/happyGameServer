const Promise = require('bluebird');
const pomelo = require('pomelo');
let baseUser = require('../../../appserver/base/baseUser');
const logger = require('pomelo-logger').getLogger('connect');
const common = require('../../../util/common');
module.exports = function (app) {
	return new Handler(app);
};

var Handler = function (app) {
	this.app = app;
	this.sessionService = app.get('sessionService');
	this.loginmap = {};
};

/**
 * New client entry.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
Handler.prototype.entry = function (msg, session, next) {
	next(null, {
		code: 200,
		msg: 'game server is ok.'
	});
};

/**
 * Publish route for mqtt connector.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
Handler.prototype.publish = function (msg, session, next) {
	var result = {
		topic: 'publish',
		payload: JSON.stringify({
			code: 200,
			msg: 'publish message is ok.'
		})
	};
	next(null, result);
};

/**
 * Subscribe route for mqtt connector.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
Handler.prototype.subscribe = function (msg, session, next) {
	var result = {
		topic: 'subscribe',
		payload: JSON.stringify({
			code: 200,
			msg: 'subscribe message is ok.'
		})
	};
	next(null, result);
};

/**
 * 登录{mobile,password,device}
 */
Handler.prototype.login = function (msg, session, next) {
	if (!this.app.startOver) {
		return next(null, {
			code: -500,
			msg: '服务器启动中稍后连接'
		});
	}
	if (!msg.mobile || !msg.password) {
		return next(null, {
			code: -500,
			msg: "账号或密码不能为空"
		});
	}
	let user = null;
	if (this.loginmap[msg.mobile]) {
		return next(null, {
			code: -500,
			msg: "稍事休息！"
		});
	}
	this.loginmap[msg.mobile] = true;
	let self = this;
	setTimeout(function () {
		if (self.loginmap[msg.mobile]) {
			delete self.loginmap[msg.mobile];
		}
	}, 500);
	return pomelo.app.db.user.findOne({
			where: {
				mobile: msg.mobile
			}
		})
		.then((result) => {
			if (!result) {
				return Promise.reject({
					code: -500,
					msg: "请输入正确账号"
				});
			}
			if (result.password != msg.password) {
				return Promise.reject({
					code: -500,
					msg: "请输入正确的密码"
				});
			}
			user = result;
			return pomelo.app.userStatus.getObj(user.uid);
		})
		.then((userStatus) => {
			if (userStatus) {
				let sessions = this.sessionService.getByUid(user.uid);
				if ((!sessions || sessions.length === 0) && userStatus.sid == pomelo.app.serverId) {
					return this.dataRecovery(msg, user, userStatus, session, next);
				}
				if (userStatus.device == msg.device) {
					// 跨连接服务器登录
					if (userStatus.sid != this.app.serverId) {
						return this.InvokeKick(user.uid, oldconnectId)
							.then(() => {
								if (sessions && sessions.length > 0) {
									return Promise.promisify(this.app.sessionService.kick)(user.uid)
										.then(() => {
											return Promise.delay(50);
										})
										.then(() => {
											return this.dataRecovery(msg, user, userStatus, session, next);
										});
								}
								return this.dataRecovery(msg, user, userStatus, session, next);
							})
					} else {
						return Promise.promisify(this.app.sessionService.kick)(user.uid)
							.then(() => {
								return Promise.delay(50);
							})
							.then(() => {
								return this.dataRecovery(msg, user, userStatus, session, next);
							});
					}
				} else {
					// 不同设备登陆
					let channelService = pomelo.app.get('channelService');
					let oldsid = userStatus.sid;
					common.createPromise(channelService, channelService.pushMessageByUids, "relogin", {}, [{
							uid: user.uid,
							sid: oldsid
						}])
						.then(() => {
							if (oldsid && oldsid != this.app.serverId) {
								return this.InvokeKick(user.uid, oldsid).then(() => {
									if (sessions && sessions.length > 0) {
										return Promise.promisify(this.app.sessionService.kick)(user.uid)
											.then(() => {
												return Promise.delay(50);
											})
											.then(() => {
												return this.dataRecovery(msg, user, userStatus, session, next);
											});
									}
									return this.dataRecovery(msg, user, userStatus, session, next);
								})
							} else {
								Promise.promisify(this.app.sessionService.kick)(user.uid)
									.then(() => {
										return Promise.delay(50);
									})
									.then(() => {
										return this.dataRecovery(msg, user, userStatus, session, next);
									});
							}
						})
				}
			}
			return this.dataRecovery(msg, user, userStatus, session, next);
		})
		.catch((error) => {
			logger.error(`Handler.prototype.login error`, error);
			error.code = error.code || -500;
			error.msg = error.msg || "登录失败";
			next(null, {
				code: error.code,
				msg: error.msg
			});
		})
};

Handler.prototype.InvokeKick = function (uid, serverId) {
	let msg = {
		namespace: 'user',
		service: `entryRemote`,
		method: `kick`,
		args: [{
			uid
		}]
	};
	return common.createPromise(pomelo.app, pomelo.app.rpcInvoke, serverId, msg)
		.then(() => {
			return Promise.resolve();
		})
};

Handler.prototype.dataRecovery = function (msg, user, userStatus, session, next) {
	let sid = pomelo.app.serverId;
	return user.update({
			isOnline: true,
			device: msg.device
		})
		.then(() => {
			if (userStatus && userStatus.iskick && userStatus.iskick == 1) {
				return Promise.delay(100);
			}
			return Promise.resolve();
		})
		.then(() => {
			session.set('uid', user.uid);
			session.set('sid', sid);
			session.on('closed', onUserLeave.bind(null, this.app));
			return common.createPromise(session, session.bind, user.uid);
		})
		.then(() => {
			return common.createPromise(session, session.pushAll);
		})
		.then(() => {
			if (userStatus) {
				userStatus = {
					uid: user.uid,
					sid: sid,
					gameType: userStatus ? (userStatus.gameType ? userStatus.gameType : null) : null,
					gameServerId: userStatus ? (userStatus.gameServerId ? userStatus.gameServerId : null) : null,
					status: userStatus ? ((userStatus.status && userStatus.status != 0) ? userStatus.status : 0) : 0,
					roomId: userStatus ? (userStatus.roomId ? userStatus.roomId : null) : null
				};
			} else {
				userStatus = {
					uid: user.uid,
					sid: sid,
					gameType: null,
					gameServerId: null,
					status: 0,
					roomId: null
				};
			}
			return pomelo.app.userStatus.setObj(userStatus);
		})
		.then(() => {
			let userInfo = new baseUser();
			next(null, {
				code: 200,
				msg: {
					user: userInfo.getBaseInfo(user),
					userStatus
				}
			});
			pomelo.app.configRedis.hset('allUserCount', pomelo.app.serverId, Object.keys(this.sessionService.service.uidMap).length);
		})
		.catch((error) => {
			logger.error(`Handler.prototype.dataRecovery error`, error);
			error.code = error.code || -500;
			error.msg = error.msg || "登录失败";
			next(null, {
				code: error.code,
				msg: error.msg
			});
		})
}

var onUserLeave = function (app, session, reason) {
	pomelo.app.configRedis.hset('allUserCount', pomelo.app.serverId, Object.keys(pomelo.app.get('sessionService').service.uidMap).length);
	if (!session || !session.uid) {
		logger.error(`onUserLeave 出错 ${session}`);
		return;
	}
	let uid = session.uid;
	let sid = session.get('sid');
	logger.info(`${session.uid} 用户离开，sid: ${pomelo.app.serverId} reason: ${JSON.stringify(reason)}`);
	pomelo.app.userStatus.getObj(uid)
		.then((userState) => {
			let iskick = 0;
			if (userState && userState.gameType && userState.gameServerId) {
				iskick = 1;
				common.sendWithRpcInvoke(userState.gameType, userState.gameServerId, 'kick', [uid, sid, userState.roomId ? userState.roomId : null], function () {
					let userStatus = {
						uid,
						iskick: null
					};
					pomelo.app.userStatus.setObj(userStatus);
				});
			}
			let userStatus = {
				uid,
				iskick
			};
			pomelo.app.userStatus.setObj(userStatus);
		});
	pomelo.app.db.user.update({
		isOnline: false
	}, {
		where: {
			uid
		}
	})
};