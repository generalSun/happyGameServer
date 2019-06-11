const express = require('express');
const router = express.Router();
module.exports = router;
const Promise = require('bluebird');
const SMSmsg = require('../../util/SMSmsg');
const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger('common');
// 该路由使用的中间件
router.use(function timeLog(req, res, next) {
	console.log('pay Time: ', Date.now());
	next();
});
router.post('/getSMS', function (req, res) {
	var param = req.body;
	if (!param.phoneNum || param.phoneNum.length != 11) {
		return res.send({code:-500,msg:'请填写正确手机号码'});
	}
	let phoneNum = param.phoneNum;
	SMSmsg.sendSMS(phoneNum)
		.then((result) => {
			return res.send(result);
		})
		.catch((error) => {
			logger.error('getSMS', { error, param });
			if (error.code) {
				return res.send(error);
			}
			return res.send({ code: -500, msg: '获取验证码发生错误' });
		})
})

router.post('/checkSMS', function (req, res) {
	var param = req.body;
	if (!param.phoneNum || param.phoneNum.length != 11) {
		return res.send({code:-500,msg:'请填写正确手机号码'});
	}
	if (!param.code || param.code.length != 6) {
		return res.send({code:-500,msg:'请填写正确验证码'});
	}
	SMSmsg.checkSMS(param.phoneNum,param.code)
		.then((result) => {
			if(!param.needcreate){
				return res.send(result);
			}
			return pomelo.app.db.user.findOne({where:{mobile:param.phoneNum}})
			.then((result)=>{
				if(result){
					return res.send({code:200,msg:{mobile:param.phoneNum,pwd:result.password}});
				}
				return pomelo.app.db.user.create({
					nick: `用户${param.phoneNum.substr(7)}`,
					password: param.code,
					bean:20000,
					mobile:param.phoneNum
				})
				.then((result)=>{
					return res.send({code:200,msg:{mobile:param.phoneNum,pwd:result.password}});
				})
			})
		})
		.catch((error) => {
			logger.error('checkSMS', { error, param });
			if (error.code) {
				return res.send(error);
			}
			return res.send({ code: -500, msg: '验证码验证失败' });
		})
})
