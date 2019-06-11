/*
 * createTime：2019/3/18
 * author：wm
 * description: 极速麻将
 */
const baseTable = require('../base/baseTable');
const logger = require('pomelo-logger').getLogger('common');
const pomelo = require('pomelo');
const _ = require('lodash');
const Promise = require('bluebird');
const common = require('../../../util/common');
const TIMER_ID = common.TIMER_ID;
const GAMESTATE = common.GAMESTATE;
const USER_STATUS = common.USER_STATUS;
const MJCONST = common.MJCONST;
class speedMJTable extends baseTable{
	constructor(tableidx,roomInfo) {
		super(tableidx,roomInfo);
		this.api = require('./speedMJApi');
	}

	//查找一个空位
	findNullChair() {
		if (!this.getUserByChair(0)) {
			return 0;
		}
		if (!this.getUserByChair(2)) {
			return 2;
		}
		return -1;
	};

	/**
   * 切换到下一个玩家
   */
	swapToNextUser() {
		let chair = this.mapUserInfo[this.currentOutId].chair;
		this.currentOutId = this.getUserByChair((chair + 2) % 4).uid;
	}

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
    this.closeTimer(TIMER_ID.ID_OPREATOR);
    this.closeTimer(TIMER_ID.ID_CHECKTINGHU);
  }

  /**
   * 关闭定时器
   * @param {Number} timerId		定时器Id
   * @param {Number} userId    玩家ID
   */
  closeTimer(timerId, userId) {
    switch (timerId) {
      case TIMER_ID.ID_TRUSTEE: // 托管
        common.clearGameTimeout(this.timerNameTrustee);
        break;
      case TIMER_ID.ID_READY: // 准备定时器
        if (this.unreadyKickTime[userId]) {
          delete this.unreadyKickTime[userId]
        };
        common.clearGameTimeout(this.timerNameReady + userId);
        break;
      case TIMER_ID.ID_OUT_CARD: // 出牌
        this.operatorClockTime = 0;
        common.clearGameTimeout(this.timerNameOutCard);
        break;
      case TIMER_ID.ID_OFFLINE_KCIK: // 掉线清理定时器
        common.clearGameTimeout(this.timerNameOffline + userId);
        break;
      case TIMER_ID.ID_OPREATOR: // 基础操作的定时器
        common.clearGameTimeout(this.timerNameOperation);
        break;
      case TIMER_ID.ID_CHECKTINGHU: // 检查听胡定时器
        common.clearGameTimeout(this.timerNameCheckTinghu);
        break;
    }
  }

	/**
	 * 一局开始
	 */
	onGameStart() {
		this.inning++;
		this.twodices = [];
		// #1 初始化
		this.closeTimers();
		// #3 洗牌
		this.allCards = this.api.shuffleCard().slice();
		for (let key in this.mapUserInfo) {
			// 设置状态
			this.mapUserInfo[key].userStatus = USER_STATUS.ST_PLAY;
			// #4 发牌
			this.mapUserInfo[key].handCards = this.allCards.splice(0, 4);
			this.mapUserInfo[key].trustlaps = 0;
			this.mapUserInfo[key].outCards = [];
			this.mapUserInfo[key].isTing = false;
		}
		// #7 开局，发送开始消息
		let diceNum1 = Math.ceil(Math.random() * 6);
		let diceNum2 = Math.ceil(Math.random() * 6);
		if (diceNum1 == 0) {
			diceNum1 = 6;
		}
		if (diceNum2 == 0) {
			diceNum2 = 6;
		}
		this.twodices.push(diceNum1);
		this.twodices.push(diceNum2);
		this.currentOutId = ((diceNum2 + diceNum1) % 2) ? this.getUserByChair(2).uid : this.getUserByChair(0).uid;
		let gameStartMsg = {
			twodices:this.twodices,
			leftcnt:this.allCards.length
		};
		for (let key in this.mapUserInfo) {
			let user = this.mapUserInfo[key];
			gameStartMsg["cards"] = { [key]: user.handCards.slice() };
			this.pushMsgByUid("onStart",gameStartMsg, user.uid);
		}

		this.status = GAMESTATE.RUN;
		setTimeout(() => {
			this.startTimer(TIMER_ID.ID_OUT_CARD);
		}, 3000);
	}

		/**
	 * 发牌
	 */
	dispatchCard() {
		this.closeTimer(TIMER_ID.ID_CHECKTINGHU);
		this.closeTimer(TIMER_ID.ID_OPREATOR);
		this.operation = null;
		if (!this.allCards.length) {
			this.onGameEnd(null,false);
			return false;
		}
		let card = this.allCards.pop();
		this.mapUserInfo[this.currentOutId].handCards.push(card);
		let huresult = this.api.canHu(this.mapUserInfo[this.currentOutId].handCards.slice());
		this.pushMsgByUid({ route: "dispatchCard", data: { uid: this.currentOutId, leftcnt: this.allCards.length, isTing: this.mapUserInfo[this.currentOutId].isTing, card, canhu: huresult > 0 ? true : false, tableIndex: this.tableIndex } }, this.currentOutId);
		this.pushMsgExceptUid({ route: "dispatchCard", data: { uid: this.currentOutId, leftcnt: this.allCards.length, tableIndex: this.tableIndex } }, this.currentOutId);
		if (this.mapUserInfo[this.currentOutId].isTing && !huresult) {
			this.startTimer(TIMER_ID.ID_CHECKTINGHU);
		}
		else if (this.mapUserInfo[this.currentOutId].isTing && huresult) {
			this.startTimer(TIMER_ID.ID_OPREATOR);
		}
		return true;
	}

	/**
   * 托管操作
   */
	trusteeOperate() {
		// 状态检测
		if (this.status == TABLE_STATE.ST_FREE) {
			return;
		}
		if (this.status == TABLE_STATE.ST_OUT_CARD && this.mapUserInfo[this.currentOutId]) {
			let outUser = this.mapUserInfo[this.currentOutId];
			if (outUser.handCards.length != 5) {
				logger.error('mjSpeedMJ trusteeOperate error', outUser);
				return;
			}
			let len = outUser.handCards.length;
			if (!this.mapUserInfo[this.currentOutId].isTing) {
				this.onOutCard(this.currentOutId, outUser.handCards[len - 1]);
			}
			else {
				for (let i = len - 1; i >= 0; i--){
					let cards = outUser.handCards.slice();
					cards.splice(i, 1);
					if (this.api.canTing(cards)) {
						return this.onOutCard(this.currentOutId, outUser.handCards[i]);
					}
				}
				this.mapUserInfo[this.currentOutId].isTing = false;
				return this.onOutCard(this.currentOutId, outUser.handCards[len - 1]);
			}
		}
	}

	/**
   * 切换到下一个出牌玩家
   */
	getNextUserId() {
		let currentChair = this.mapUserInfo[this.currentOutId].chair;
		let nextChair = (currentChair + 2) % 4;
		if (!this.getUserByChair(nextChair)) {
			logger.error('极速麻将发生严重错误找不到下一个玩家', this.tableIndex, this.currentOutId, currentChair, nextChair, this.maxUserCount, this.mapUserInfo);
		}
		return this.getUserByChair(nextChair).id;
	}

	/**
   * 出牌
   * @param {number} uid								出牌玩家
   * @param {Array} cards							出的牌
   * @return {boolean} 								是否成功
   */
	onOutCard(uid, cards) {
		// #1 参数校验
		if (this.status !== TABLE_STATE.ST_OUT_CARD) {
			logger.error("无法出牌，当前的阶段不是出牌阶段，status = ", { uid, status: this.status });
			return Promise.reject({ code: 13009 }); // "当前不是出牌阶段！"
		}

		if (this.currentOutId != uid.toString()) {
			logger.error("无法出牌，出牌玩家不是当前可以操作的玩家，currentOutId", { uid, outId: this.currentOutId });
			return Promise.reject({ code: 13010 }); // "不是当前出牌玩家"
		}
		let cardresult = this.mapUserInfo[uid].handCards.includes(cards);
		if (!cardresult) {
			logger.error("严重错误客户端出的牌不对，服务器没有这张牌", { cardresult, uid, outId: this.currentOutId, cards, handcards: this.mapUserInfo[uid].handCards });
			return Promise.reject({ code: 500 }); // 客户端出的牌和服务器不匹配通知客户端重启
		}

		let cardscopy = this.mapUserInfo[uid].handCards.slice();

		// #2 删除手牌
		for (let i = 0; i < this.mapUserInfo[uid].handCards.length; i++) {
			if (this.mapUserInfo[uid].handCards[i] == cards) {
				this.mapUserInfo[uid].handCards.splice(i, 1);
				break;
			}
		}

		if (this.mapUserInfo[uid].isTing && !this.api.canTing(this.mapUserInfo[uid].handCards.slice())) {
			this.mapUserInfo[uid].handCards = cardscopy;
			return Promise.reject({ code: 29002 }); // "报听后不可以瞎出牌"
		}

		// #3 保存出的牌与牌型
		this.lastOutId = this.currentOutId;
		this.lastOutCard = cards;

		// 判断对方是否可以胡牌
		let nextid = this.getNextUserId();
		let nextcards = this.mapUserInfo[nextid].handCards.slice();
		nextcards.push(cards);
		this.operation = null;
		logger.info('------- canhu --------', uid, cards, nextcards, this.mapUserInfo[nextid].handCards)
		if (this.api.canHu(nextcards)) {
			this.currentOutId = 0;
			this.operation = {
				[nextid]: [
					{
						op: MJCONST.WIK_CHI_HU,
						cards: []
					}
				]
			}
		}
		else {
			this.currentOutId = this.getNextUserId();
		}

		this.mapUserInfo[uid].outCards.push(this.lastOutCard);
		// #5 发送出牌消息
		let outCardMsg = new gdMsg.msgMJOutCard();
		outCardMsg.data.outId = uid;
		outCardMsg.data.card = cards;
		outCardMsg.data.leftcnt = this.allCards.length;
		outCardMsg.data.operation = this.operation;
		this.channel.pushMessage(outCardMsg.route, outCardMsg.data);

		this.closeTimer(TIMER_ID.ID_OUT_CARD);
		this.closeTimer(TIMER_ID.ID_CHECKTINGHU);
		this.closeTimer(TIMER_ID.ID_OPREATOR);
		if (this.operation && !this.currentOutId) {
			this.startTimer(TIMER_ID.ID_OPREATOR);
		}
		else {
			// 启动出牌定时器
			this.startTimer(TIMER_ID.ID_OUT_CARD);
			// 托管
			if (this.mapUserInfo[this.currentOutId].isNotNormal()) {
				this.startTimer(TIMER_ID.ID_TRUSTEE);
			}
		}
		return Promise.resolve();
	}

	/**
	 * 检查玩家操作
	 */
	checkOperator() {
		if (this.operation && !this.currentOutId) {
			this.currentOutId = this.lastOutId;
			this.currentOutId = this.getNextUserId();
			// 启动出牌定时器
			this.startTimer(TIMER_ID.ID_OUT_CARD);
			// 托管
			if (this.mapUserInfo[this.currentOutId].isNotNormal()) {
				this.startTimer(TIMER_ID.ID_TRUSTEE);
			}
		}
		else if (this.currentOutId && this.mapUserInfo[this.currentOutId].isTing) {
			this.trusteeOperate();
		}
	}


	/**
	 * 检查玩家操作权位例如吃胡
	 */
	onOperation(uid, op) {
		if (this.mapUserInfo[uid] && this.operation && !this.currentOutId && this.operation[uid] && this.lastOutCard) {
			let handcard = this.mapUserInfo[uid].handCards.slice();
			handcard.push(this.lastOutCard);
			for (let i = 0; i < this.operation[uid].length; i++) {
				if (op == this.operation[uid][i].op && op == MJCONST.WIK_CHI_HU && this.api.canHu(handcard)) {
					if (this.mapUserInfo[this.lastOutId]) {
						let outcards = this.mapUserInfo[this.lastOutId].outCards;
						for (let i = outcards.length - 1; i >= 0; i--){
							if (outcards[i] == this.lastOutCard) {
								outcards.splice(i, 1);
								break;
							}
						}
					}
					
					this.onGameEnd(uid, false);
					return Promise.resolve();
				}
			}
		}
		else if (this.currentOutId == uid && this.api.canHu(this.mapUserInfo[uid].handCards.slice())) {
			this.onGameEnd(uid, true);
			return Promise.resolve();
		}
		return Promise.reject({ code: 29001 });
	}

	/**
	 * 玩家放弃操作权益
	 */
	onGiveUp(uid) {
		if (this.mapUserInfo[uid] && this.operation && !this.currentOutId && this.operation[uid]) {
			this.operation = null;
			this.currentOutId = this.lastOutId;
			this.currentOutId = this.getNextUserId();
			// 启动出牌定时器
			this.startTimer(TIMER_ID.ID_OUT_CARD);
			// 托管
			if (this.mapUserInfo[this.currentOutId].isNotNormal()) {
				this.startTimer(TIMER_ID.ID_TRUSTEE);
			}
		}
		else if (this.currentOutId == uid && !this.operation && this.mapUserInfo[uid].isTing) {
			this.trusteeOperate();
			return Promise.resolve(1);
		}
		if (this.currentOutId == uid) {
			return Promise.resolve(2);
		}
		return Promise.resolve(0);
	}

	/**
	 * 启动定时器
	 * @param {*} timerId 定时器id
	 * @param {*} userId 
	 */
	startTimer(timerId, userId = 0) {
		let self = this;
		switch (timerId) {
			case TIMER_ID.ID_OUT_CARD: // 出牌定时器
				if (!this.dispatchCard()) {
					return;
				}
				this.mapUserOutTime[this.currentOutId] = new Date().getTime();
				this.operatorClockTime = new Date().getTime() + (this.baseOperationTime + 1) * 1000;
				common.setGameTimeout(this.timerNameOutCard, (this.baseOperationTime + 1) * 1000, () => {
					this.onTrust(this.currentOutId, true);
				});
				break;
			case TIMER_ID.ID_OPREATOR: // 操作定时器
				this.mapUserOutTime["operation"] = new Date().getTime();
				this.operatorClockTime = new Date().getTime() + this.operationTime * 1000;
				common.setGameTimeout(this.timerNameOperation, this.operationTime * 1000, () => {
					this.checkOperator();
				});
				break;
			case TIMER_ID.ID_CHECKTINGHU: // 检查听胡定时器
				common.setGameTimeout(this.timerNameCheckTinghu, 1 * 1000, () => {
					if (this.currentOutId && this.mapUserInfo[this.currentOutId].handCards.length == 5
						&& !this.api.canHu(this.mapUserInfo[this.currentOutId].handCards.slice())) {
						this.trusteeOperate();
					}
				});
				break;
			case TIMER_ID.ID_TRUSTEE: // 托管延时操作定时器
				common.setGameTimeout(this.timerNameTrustee, 2 * 1000, () => {
					if (this.currentOutId && this.mapUserInfo[this.currentOutId].isNotNormal()) {
						if (this.api.canHu(this.mapUserInfo[this.currentOutId].handCards.slice())) {
							return this.onGameEnd(this.currentOutId, true);
						}
						this.trusteeOperate();
					}
				});
				break;
			case TIMER_ID.ID_READY: // 准备倒计时
				let tmpTimerName = this.timerNameReady + userId;
				this.unreadyKickTime[userId] = new Date().getTime();
				common.setGameTimeout(tmpTimerName, this.readyTime * 1000, () => {
					if (self.mapUserInfo[userId] && !self.mapUserInfo[userId].isPlaying()) {
						self.sendPlayersLeave([userId], KICK_TYPE.NOT_READY);
					}
				});
				break;
			case TIMER_ID.ID_OFFLINE_KCIK: // 掉线提出定时器
				let timerNameOffline = this.timerNameOffline + userId;
				common.setGameTimeout(timerNameOffline, 60 * 1000, () => {
					let user = self.mapUserInfo[userId] || self.mapLookInfo[userId];
					if (!user || user.isOnline() || user.isPlaying()) {
						return;
					}
					self.leave(userId);
				});
				break;
		}
	};

	/**
   * 结算消息发送前还要干点什么
   */
	async doSthBeforePushend(gameEndMsg) {
		this.channel.pushMessage(gameEndMsg.route, gameEndMsg.data);
		this.resetUserStatus();
	}

	/**
   * 清理桌子
   */
	resetUserStatus() {
		logger.info('----- speedmj resetUserStatus ----');
		this.updateOnlineData();
		let uids = [];
		// 先清理掉线的
		for (let key in this.mapUserInfo) {
			this.mapUserInfo[key].userStatus = USER_STATUS.ST_FREE;
			if (!this.mapUserInfo[key].isOnline()) {
				uids.push(key);
				pomelo.app.userRedis.exists(`user_${key}`).then((result) => {
					if (result) {
						userDao.updateToDB(key);
					}
				})
			}
		}
		if (uids.length) {
			this.sendPlayersLeave(uids, KICK_TYPE.OFFLINE_TRUST);
		}
		// 再清理豆子不足的特殊处理PC端
		uids = [];
		for (var key in this.mapUserInfo) {
			if (this.costType == CostType.COIN && this.mapUserInfo[key].coin < this.kickcount && this.mapUserInfo[key].clientType == "pc") {
				uids.push(key);
			}
		}
		if (uids.length && this.costType == CostType.COIN) {
			this.sendPlayersLeave(uids, KICK_TYPE.NO_COIN);
		} 


		for (var key in this.mapUserInfo) {
			this.mapUserInfo[key].cleanUserInfo();
		}
		this.status = TABLE_STATE.ST_FREE;
		this.currentOutId = ""; // 当前出牌玩家Id
		this.lastOutId = 0; // 上一个出牌玩家
		this.allCards = [];
		this.operation = null;					//玩家操作权位
		this.lastOutCard = 0;
		this.usedTimer = []; // 本局已经使用过的计时器
		this.operatorClockTime = 0;   // 定时器开始计时时间戳
		this.unreadyKickTime = {}; // 未准备踢出倒计时
		for (let key in this.mapUserInfo) {
			// 开启准备定时器
			this.startTimer(TIMER_ID.ID_READY, key);
			this.sendUserInfoChangeToPC(key);
		}
	}

	/**
	 * 准备
	 */
	onReady(uid) {
		if (!this.mapUserInfo[uid]) {
			return Promise.reject({ code: 500, msg: '人不在桌子上' }); // 玩家不在桌上
		}
		if (this.costType == CostType.BEAN && this.mapUserInfo[uid].bean < this.kickcount) {
			return userDao.getUser(uid)
				.then((result) => {
					if (!result) {
						return Promise.reject({ code: 20007 });
					}
					if (result.bean != this.mapUserInfo[uid].bean) {
						this.mapUserInfo[uid].bean = parseInt(result.bean);
						this.mapUserInfo[uid].gold = parseInt(result.gold);
						if (this.mapUserInfo[uid].bean < this.kickcount) {
							return Promise.reject({ code: 20007 });
						}
						this.sendUserPropertyChangeOnTalbe(uid, { bean: this.mapUserInfo[uid].bean, gold: this.mapUserInfo[uid].gold }); // 通知桌上玩家该玩家豆子变了
						return this.readyToStart(uid);
					}
					return Promise.reject({ code: 20007 });
				})
		}
		if (this.costType == CostType.COIN && this.mapUserInfo[uid].coin < this.kickcount) {
			return userDao.getUser(uid)
				.then((result) => {
					if (!result) {
						return Promise.reject({ code: 28000, msg: this.kickcount });
					}
					if (result.coin != this.mapUserInfo[uid].coin) {
						this.mapUserInfo[uid].coin = parseInt(result.coin);
						this.mapUserInfo[uid].gold = parseInt(result.gold);
						if (this.mapUserInfo[uid].coin < this.kickcount) {
							return Promise.reject({ code: 28000, msg: this.kickcount - this.mapUserInfo[uid].coin });
						}
						this.sendUserPropertyChangeOnTalbe(uid, { coin: this.mapUserInfo[uid].coin, gold: this.mapUserInfo[uid].gold }); // 通知桌上玩家该玩家豆子变了
						return this.readyToStart(uid);
					}
					return Promise.reject({ code: 28000, msg: this.kickcount - this.mapUserInfo[uid].coin });
				})
		}
		return super.onReady(uid);
	}
	/**
	 * 谁胡牌了当uid 存在时表示牌抓完了没人胡
	 * @param {*} uid 
	 * @param {*} zimo 表示是否自摸
	 */
	onGameEnd(uid, zimo = false) {
		logger.info('------ onGameEnd -----', uid, zimo, this.lastOutCard)
		this.closeTimers();
		let fan = 0;
		let cards = null;
		if (uid && !this.mapUserInfo[uid]) {
			logger.error("发生严重错误 mjSpeedMJ cannot hu 0", this.mapUserInfo[uid], this.lastOutCard, zimo);
			return;
		}
		if (uid && this.mapUserInfo[uid] && this.lastOutCard && !zimo) {
			cards = this.mapUserInfo[uid].handCards.slice();
			cards.push(this.lastOutCard);
			fan = this.api.canHu(cards);
			if (!fan) {
				logger.error("发生严重错误 mjSpeedMJ cannot hu 1", this.mapUserInfo[uid], this.lastOutCard, zimo);
				return;
			}
			this.mapUserInfo[uid].handCards.push(this.lastOutCard);
		}
		else if (uid && this.mapUserInfo[uid] && zimo) {
			cards = this.mapUserInfo[uid].handCards.slice();
			fan = this.api.canHu(cards);
			if (!fan) {
				logger.error("发生严重错误 mjSpeedMJ cannot hu 2", this.mapUserInfo[uid], this.lastOutCard, zimo);
				return;
			}
		}
		if (fan && this.mapUserInfo[uid].isTing) {
			fan += 2;
		}

		if (uid) {
			let huinfo = new gdMsg.msgMJHu;
			huinfo.data.uid = uid;
			for (let key in this.mapUserInfo) {
				huinfo.data.cards[key] = this.mapUserInfo[key].handCards;
			}
			huinfo.data.zimo = zimo;
			this.channel.pushMessage(huinfo.route, huinfo.data);
		}

		let gameEndInfo = new gdMsg.msgMJGameEnd;
		if (uid) {
			gameEndInfo.data.winner = uid;
			gameEndInfo.data.fan = fan;
			gameEndInfo.data.zimo = zimo;
			gameEndInfo.data.costType = this.room.costType;
		}
		for (let key in this.mapUserInfo) {
			let user = this.mapUserInfo[key];
			gameEndInfo.data.userInfos.push({
				id: user.uid,
				bean: key == uid ? fan * this.baseCost : -fan * this.baseCost,
				cards: user.handCards,
				nickName: user.nickName
			})
		}
		for (let key in this.mapUserInfo) {
			this.mapUserInfo[key].trust = 0;
			this.mapUserInfo[key].userStatus = 0;
		}
		this.doSthBeforePushend(gameEndInfo);
		
	}


	/**
	 * 玩家触发听设置
	 * @param {*} uid 
	 */
	onTing(uid) {
		if (this.currentOutId != uid) {
			return Promise.reject({ code: 13010 }); // "不是当前操作玩家"
		}
		if (!this.mapUserInfo[uid]) {
			return Promise.reject({ code: 500 }); // "玩家不在桌上！"
		}
		if (this.mapUserInfo[uid].handCards.length != 5) {
			return Promise.reject({ code: 13010, msg: "手上只有四张牌不能操作" }); // "不是当前操作玩家"
		}
		if (this.status !== TABLE_STATE.ST_OUT_CARD) {
			logger.error("onTing error，status = ", { uid, status: this.status });
			return Promise.reject({ code: 13009 }); // "当前不是出牌阶段！"
		}
		if (this.api.canBaoTing(this.mapUserInfo[uid].handCards.slice())) {
			this.mapUserInfo[uid].isTing = true;
			this.channel.pushMessage("onUserTing", { uid, tableIndex: this.tableIndex });
			return Promise.reject({ code: 200 });
		}
		return Promise.reject({ code: 29000 });
	}

	resetTable() {
		this.closeTimers();
		this.status = GAMESTATE.FREE;
		this.mapUserInfo = {};
		if (this.channel) {
			let userTemps = this.getAllPersonExcept([]);
			if (userTemps && userTemps.length) {
				for (let i = 0; i < userTemps.length; i++) {
					if (userTemps[i] && userTemps[i].uid && userTemps[i].sid) {
						this.channel.leave(userTemps[i].uid, userTemps[i].sid);
					}
				}
			}
		}
		
		this.currentOutId = ""; // 当前出牌玩家Id
		this.lastOutId = 0; // 上一个出牌玩家
		this.allCards = [];
		this.operation = null;					//玩家操作权位
		this.lastOutCard = 0;
		this.operatorClockTime = 0;   // 定时器开始计时时间戳
		this.unreadyKickTime = {}; // 未准备踢出倒计时
	};
}

module.exports = speedMJTable;