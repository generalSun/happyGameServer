const Promise = require('bluebird');
const pomelo = require('pomelo');
let baseUser = require('../../../appserver/base/baseUser');
const logger = require('pomelo-logger').getLogger('con-log');
const common = require('../../../util/common');
const SocketCmd = require('../../../appserver/cmd/socketCmd')
var utils = require('../../../util/utils');
var Code = require('../../../../../shared/code');
module.exports = function (app) {
	return new Handler(app);
};

var Handler = function (app) {
	this.app = app;
	this.sessionService = app.get('sessionService');
	this.loginmap = {};
};

var handler = Handler.prototype;

//客户端发送的socket消息
handler.socketMsg = function(msg, session, next) {
	var self = this;
	if (! self.socketCmdConfig) {
		self.initSocketCmdConfig();
	}
	logger.info("收到客户端发送的消息");
	utils.printObj(msg);

	var msgSocketCmd = msg.socketCmd;
	var processerFun = self.socketCmdConfig[msgSocketCmd];
	if (!! processerFun) {
		processerFun.call(self, msg, session, next);
	} else {
		logger.error('没有找到处理函数, cmd = ' + msgSocketCmd);
		next(null, {
			code: Code.NO_HANDLER,
			describle: "没有找到处理函数"
		})
	}
};

handler.initSocketCmdConfig = function() {
	var self = this;
	self.socketCmdConfig = {
		[SocketCmd.LOGIN]: login,
		[SocketCmd.GETSMS]: getSMS,
		[SocketCmd.CHECKSMS]: checkSMS,
		[SocketCmd.RELOAD_GAME]: reloadGame,
		[SocketCmd.REQUEST_USER_INFO]: requestUserInfo,
		[SocketCmd.ENTER_GROUP_LEVEL]: enterGroupLevel,
		[SocketCmd.GET_CREATE_FRIEND_ROOM_CONFIG]: getCreateFriendRoomConfig,
		[SocketCmd.CREATE_FRIEND_ROOM]: createFriendRoom,
		[SocketCmd.ENTER_FRIEND_ROOM]: enterFriendRoom,
		[SocketCmd.USER_LEAVE]: commonRoomMsg,
		[SocketCmd.USER_READY]: commonRoomMsg,
		[SocketCmd.OPE_REQ]: commonRoomMsg,
	};
};

//登录
var login = function(msg, session, next) {
	var self = this;
	self.app.rpc.auth.authRemote.login(msg, session, next);
};

//获取验证码
var getSMS = function(msg, session, next) {
	var self = this;
	self.app.rpc.auth.authRemote.getSMS(msg, session, next);
};

//验证验证码
var checkSMS = function(msg, session, next) {
	var self = this;
	self.app.rpc.auth.authRemote.checkSMS(msg, session, next);
};

var reloadGame = function(msg, session, next) {
	var self = this;
};

var requestUserInfo = function(msg, session, next) {
	var self = this;
};

var enterGroupLevel = function(msg, session, next) {
	var self = this;
};

var getCreateFriendRoomConfig = function(msg, session, next) {
	var self = this;
};

var createFriendRoom = function(msg, session, next) {
	var self = this;
};

var enterFriendRoom = function(msg, session, next) {
	var self = this;
};

var commonRoomMsg = function(msg, session, next) {
	var self = this;
};

