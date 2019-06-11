const dispatcher = require('../../../util/dispatcher');
const logger = require('pomelo-logger').getLogger('common');
const pomelo = require('pomelo');
module.exports = function (app) {
	return new Handler(app);
};
var Handler = function (app) {
	let self = this;
	this.app = app;
};
/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
Handler.prototype.queryEntry = function (msg, session, next) {
	if (!this.app.startOver) {
		return next(null, { code: -500, msg: '服务器启动中稍后连接' });
	}
	var connectors = this.app.getServersByType('connector');
	if (!connectors || connectors.length === 0) {
		logger.error('获取服务器列表失败', { connectors, msg });
		return next(null, {
			code: -500,
			msg: '连接服务器失败'
		});
	}
	var res = dispatcher.dispatch(new Date().getTime().toString(), connectors);
	next(null, {
		code: 200,
		host: "192.168.1.211",
		port: res.clientPort
	});
};