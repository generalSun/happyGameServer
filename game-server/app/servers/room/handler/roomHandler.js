const Promise = require('bluebird');
const pomelo = require('pomelo');
let baseUser = require('../../../appserver/base/baseUser');
const logger = require('pomelo-logger').getLogger('pomelo');

class RoomHandler {
	constructor() {
		this.mapUid = {}; // 玩家uid操作记录
	}
	/**
	 * 玩家进入房间
	 * @param {*} msg 
	 * @param {*} session 
	 * @param {*} next 
	 */
	enterRoom(msg, session, next) {
		if (!session.uid) {
			return next(null, { code: 500 });
		}
		if (msg.roomId == undefined || !pomelo.app.service.rooms[msg.roomId]) {
			return next(null, { code: -500, msg: '参数错误' });
		}
		if (pomelo.app.service.checkOnTable(session.uid)) {
			// 已经在桌子上了
			return next(null, { code: 500 });
		}

		// 防止客户端触发多消息逻辑
		if (this.mapUid[session.uid]) {
			return next(null, { code: -1000 });
		}
		this.mapUid[session.uid] = true;

		// 玩家进房
		pomelo.app.service.enterRoom(msg.roomId, session)
			.then((result) => {
				delete this.mapUid[session.uid];
				next(null, { code: 200, msg: result });
			})
			.catch((error) => {
				delete this.mapUid[session.uid];
				logger.error('enterRoom error', error);
				error.code = error.code || 500;
				error.msg = error.msg || "进入房间发生错误";
				return next(null, error);
			})
	}

	/**
	 * 离开房间
	 * @param {*} msg 
	 * @param {*} session 
	 * @param {*} next 
	 */
	leaveRoom(msg, session, next) {
		if (!session.uid) {
			return next(null, { code: 500 });
		}
		if (msg.roomId == undefined || !pomelo.app.service.rooms[msg.roomId]) {
			return next(null, { code: -500, msg: '参数错误' });
		}
		if (pomelo.app.service.checkOnTable(session.uid)) {
			// 已经在桌子上了
			return next(null, { code: 500 });
		}

		// 防止客户端触发多消息逻辑
		if (this.mapUid[session.uid]) {
			return next(null, { code: -1000 });
		}
		this.mapUid[session.uid] = true;

		// 玩家离开房间
		pomelo.app.service.leaveRoom(msg.roomId, session.uid)
			.then((result) => {
				delete this.mapUid[session.uid];
				next(null, { code: 200 });
			})
			.catch((error) => {
				delete this.mapUid[session.uid];
				logger.error('enterRoom error', error);
				error.code = error.code || 500;
				error.msg = error.msg || "离开房间发生错误";
				return next(null, error);
			})
	}

	/**
	 * 玩家上座
	 * @param {*} msg 
	 * @param {*} session 
	 * @param {*} next 
	 */
	enterTable(msg, session, next) {
		if (!session.uid) {
			return next(null, { code: 500 });
		}

		if (msg.table == undefined || msg.chair == undefined || msg.table < 0 || msg.chair < 0 || msg.chair > 3) {
			return next(null, { code: -500, msg: '参数错误' });
		}

		if (pomelo.app.service.checkOnTable(session.uid)) {
			// 已经在桌子上了
			return next(null, { code: 500 });
		}

		// 防止客户端触发多消息逻辑
		if (this.mapUid[session.uid]) {
			return next(null, { code: -1000 });
		}
		this.mapUid[session.uid] = true;

		// 玩家上座
		pomelo.app.service.enterTable(msg.table, msg.chair, session)
			.then((result) => {
				delete this.mapUid[session.uid];
				next(null, { code: 200, msg: result });
			})
			.catch((error) => {
				delete this.mapUid[session.uid];
				logger.error('enterRoom error', error);
				error.code = error.code || 500;
				error.msg = error.msg || "玩家上座发生错误";
				return next(null, error);
			})
	}

	/**
	 * 主动从桌子上返回房间
	 * @param {*} msg 
	 * @param {*} session 
	 * @param {*} next 
	 */
	backToRoom(msg, session, next) {
		if (!session.uid) {
			return next(null, { code: 500 });
		}

		if (!pomelo.app.service.checkOnTable(session.uid)) {
			return next(null, { code: 200, msg: false });
		}

		let table = pomelo.app.service.mapUserTable[session.uid];
		if (!table.canLeave()) {
			return next(null, { code: -500, msg: '游戏中无法离开' });
		}
		next(null, { code: 200, msg: true });
		table.leaveTable(session.uid);
	}

	/**
	 * 玩家准备
	 * @param {*} msg 
	 * @param {*} session 
	 * @param {*} next 
	 */
	onReady(msg, session, next) { 
		if (!session.uid) {
			return next(null, { code: 500 });
		}

		if (!pomelo.app.service.checkOnTable(session.uid)) {
			return next(null, { code: 200, msg: false });
		}
		let table = pomelo.app.service.mapUserTable[session.uid];
		table.onReady(session.uid, (result) => {
			return next(null, result);
		})
	}
}
module.exports = new RoomHandler();