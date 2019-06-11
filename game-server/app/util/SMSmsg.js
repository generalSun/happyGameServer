/**
 * 短信验证
 * created by wangming 2018/7/23
 */
const Promise = require('bluebird');
const pomelo = require('pomelo');
const SMSClient = require('@alicloud/sms-sdk');
const exp = module.exports;
const accessKeyId = 'LTAIpB3NUo3TYlNE';
const secretAccessKey = 'H89qcB8fiqOmrkpZWdGirTB8uGRAPm';
const common = require('./common');
const logger = require('pomelo-logger').getLogger('common');

//初始化sms_client
let smsClient = new SMSClient({ accessKeyId, secretAccessKey });

exp.sendSMS = function (PhoneNumbers) {
  let code = '';
  if (!/^[1][0-9]{10}$/.test(PhoneNumbers)) {
    return Promise.reject({ code: -500,msg:"请检查手机号是否正确" }); //请检查手机号是否正确
  }
  return pomelo.app.configRedis.get(PhoneNumbers)
    .then((result) => {
      if (result) {
        return pomelo.app.configRedis.ttl(PhoneNumbers);
      }
      return Promise.resolve();
    })
    .then((result) => {
      if (result) {
        if (result > 30) {
          return Promise.reject({ code: 800, msg: result }); //该手机号已发送过验证码,您可以继续使用该验证码验证,msg是剩余时间
        }
      }
      code = common.getRandomString(6, true);
      let msgcode = { code };
      // 发送短信
      return smsClient.sendSMS({
        PhoneNumbers,
        SignName: '掼蛋世界',
        TemplateCode: 'SMS_140065085',
        TemplateParam: common.stringify(msgcode)
      })
    })
    .then((res) => {
      let { Code } = res
      if (Code === 'OK') {
        // 处理返回参数
        return pomelo.app.configRedis.set(PhoneNumbers, code, 'NX', 'EX', 380);
      }
      return Promise.reject(res);
    })
    .then(() => {
      return Promise.resolve({code:200,msg:380});
    })
    .catch((error) => {
      logger.error('获取短信验证码失败', { PhoneNumbers, error });
      console.log('code',error.code)
      if (error.code && (error.code == -500 || error.code == 800)) {
        return Promise.reject(error);
      }
      if (error.code && error.code == 'isv.BUSINESS_LIMIT_CONTROL') {
        return Promise.reject({ code: -500,msg:"同一个手机号码发送短信验证码，支持1条/分钟，5条/小时 ，累计10条/天" }); // 同一个手机号码发送短信验证码，支持1条/分钟，5条/小时 ，累计10条/天
      }
      return Promise.reject({ code: -500,msg:"获取验证码失败请检查手机号是否正确" });//获取验证码失败请检查手机号是否正确
    })
}

exp.checkSMS = function (PhoneNumbers, code) {
  if (!/^[1][0-9]{10}$/.test(PhoneNumbers)) {
    console.log('---------1----');
    return Promise.reject({ code: -500,msg:"请检查手机号是否正确" });  //请检查手机号是否正确
  }
  return pomelo.app.configRedis.get(PhoneNumbers)
    .then((reuslt) => {
      if (reuslt) {
        if (reuslt == code) {
          return pomelo.app.configRedis.del(PhoneNumbers);
        }
        return Promise.reject({ code: -500,msg:"验证码不正确请重新输入" }); //验证码不正确请重新输入
      }
      return Promise.reject({ code: -500,msg:"该验证码已过期请重新获取" }); //该验证码已过期请重新获取
    })
    .then(() => {
      return Promise.resolve({ code: 200, msg: { mobile: PhoneNumbers, pwd: code } });
    })
    .catch((error) => {
      logger.error('验证短信验证码失败', { PhoneNumbers, code, error });
      //短信验证失败,其他未知异常
      if(error.code != -500){
        error.code = -500;
        error.msg = "未知错误";
      }
      return Promise.reject(error);
    });
}