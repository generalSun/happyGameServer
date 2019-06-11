const exp = module.exports;
const Promise = require('bluebird');
const pomelo = require('pomelo');
const _ = require('lodash');
const logger = require('pomelo-logger').getLogger('connect');
/**
 * 创建Promise
 * @param {class} target 
 * @param {Function} fun 
 */
exp.createPromise = function (target, fun) {
  let args = Array.prototype.slice.call(arguments, 2);
  return new Promise(function (resolve, reject) {

    args.push(function (err, result) {
      let cbArgs = Array.prototype.slice.call(arguments);
      if (cbArgs.length == 1) {
        result = err;
        err = null;
      }

      if (err)
        reject(err);
      else
        resolve(result);
    });
    fun.apply(target, args);
  })
};

exp.sendWithRpcInvoke = function (serverType, serverId, method, args, cb) {
  let msg = {
    namespace: 'user',
    service: `${serverType}Remote`,
    method: method,
    args
  };

  pomelo.app.rpcInvoke(serverId, msg, function (err, result) {
    if (!!err) {
      logger.error(`rpc from ${pomelo.app.serverId} to ${serverType}Remote ${method} error`, { err, msg });
    }

    cb && cb(err, result);
  });
}

/// 定时器相关
exp.timers = {};
/**
 * 判断定时器是否超时
 * @param {string} name			定时器名
 * @returns {boolean}				是否超时
 */
exp.isGameTimeout = function (name) {
  return exp.timers[name] !== undefined;
};
/**
 * 设置超时定时器
 * @param {string} name		定时器名
 * @param {number} time		定时时间（毫秒）
 * @param {function} cb		回调函数
 */
exp.setGameTimeout = function (name, time, cb) {
  // 删除超时定时器
  exp.clearGameTimeout(name);

  // 分离参数
  let args = Array.prototype.slice.call(arguments);
  args.splice(0, 3);

  // 保存定时器Id
  exp.timers[name] = setTimeout(function (args) {
    if (exp.timers[name] !== undefined) {
      delete exp.timers[name];
      cb(...args);
    }
  }, time, args);

  exp.timers[name].callback = cb;
  exp.timers[name].totalTime = time;
  exp.timers[name].startTime = Date.now();
};

/**
 * 设置间隔定时器
 * @param {string} name		定时器名
 * @param {number} time		定时时间（毫秒）
 * @param {function} cb		回调函数
 */
exp.setGameInterval = function (name, time, cb) {
  // 删除间隔定时器
  exp.clearGameInterval(name);

  // 分离参数
  let args = Array.prototype.slice.call(arguments);
  args.splice(0, 3);

  // 保存定时器Id
  exp.timers[name] = setInterval(function () {
    if (exp.timers[name] === undefined) {
      delete exp.timers[name];
    }
    else {
      cb(...args);
    }
  }, time);
};

/**
 * 清除超时定时器
 * @param {string} name		定时器名
 */
exp.clearGameTimeout = function (name) {
  if (exp.timers[name] !== undefined) {
    clearTimeout(exp.timers[name]);
    delete exp.timers[name];
  }
};

/**
 * 清除间隔定时器
 * @param {string} name		定时器名
 */
exp.clearGameInterval = function (name) {
  if (exp.timers[name] !== undefined) {
    clearInterval(exp.timers[name]);
    delete exp.timers[name];
  }
};


exp.getRandomString = function (len, onlyNum) {
  len = len || 32;
  var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnoprstuvwxyz0123456789';
  if (onlyNum) {
    $chars = '0123456789';
  }

  var maxPos = $chars.length;
  var str = '';
  for (var i = 0; i < len; i++) {
    str += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return str;
}

exp.generateSession = function (uid, sid) {
  let session = {};
  session.uid = uid;
  session.get = function () {
    return sid;
  }
  return session;
}

/**
 * string->json
 * @param {String} str 
 */
exp.parseJson = function (str) {
  return _.attempt(JSON.parse.bind(null, str));
}
/**
 * json->string
 * @param {Object} json 
 */
exp.stringify = function (json) {
  return _.attempt(JSON.stringify.bind(null, json));
}

exp.addToChannel = function (channel, uid, sid) {
  let member = channel.getMember(uid);
  if (member) {
    channel.leave(member.uid, member.sid);
  }
  channel.add(uid, sid);
}

exp.leaveChannel = function (channel, uid) {
  let member = channel.getMember(uid);
  if (member) {
    channel.leave(member.uid, member.sid);
  }
}

/**
 * 向玩家发送消息
 */
exp.pushMsg = function (route, msg, uids,cb) {
  let channelService = pomelo.app.get('channelService');
  exp.createPromise(channelService, channelService.pushMessageByUids, route, msg, uids)
    .then(() => { 
      cb && cb();
    })
    .catch((error) => {
      logger.error('exp.pushMsg error', { error, route, msg, uids })
      cb && cb(error);
    })
}

// 定时器ID
exp.TIMER_ID = {
  ID_READY: 1,								// 准备定时器
  ID_OUT_CARD: 2,						  // 出牌定时器
  ID_TRUSTEE: 3,							// 托管定时器
  ID_OFFLINE_KCIK: 4,         //掉线一段时间后踢出定时器
  ID_END_TO_CONTINUE: 5,      //一局结束到下一句开始定时器
  ID_DELAY_TO_CLEANEND: 6,    //一局结束延时清理结算
  ID_BUHUA: 7,                //补花定时器
  ID_OPREATOR: 8,             //基础操作定时器
  ID_CHECKTINGHU:9,           //检查听胡定时器

};

exp.REASON = {
  BT_UNKNOW: 0,                // 未知原因
}

// 游戏状态
exp.GAMESTATE = {
  FREE: 0,                 // 非游戏状态
  READY: 1,								// 准备状态
  RUN: 2,						      // 游戏状态
  BUHUA: 4                //补花阶段
};

/**
 * 桌子状态
 */
exp.TABLE_STATE = {
  ST_FREE: 0,					  // 空闲阶段
  ST_OUT_CARD: 1,			  // 出牌阶段
};

exp.USER_STATUS = {
  ST_FREE: 0,					// 空闲状态（未准备的状态）
  ST_READY: 1,				// 准备状态
  ST_PLAY: 2,					// 打牌状态
}

exp.MJCONST = {
  MASK_COLOR : 0x00F0,			//花色掩码
  MASK_VALUE : 0x000F,			//数值掩码
  MASK_INDEX : 0x0F00,			//索引掩码
  MAX_INDEX : 42,           //最大可能牌值
  //动作标志
  WIK_NULL : 0x00,			//没有类型
  WIK_LEFT : 0x01,			//左吃类型
  WIK_CENTER : 0x02,			//中吃类型
  WIK_RIGHT : 0x04,			//右吃类型
  WIK_PENG : 0x08,			//碰牌类型
  WIK_GANG : 0x10,			//杠牌类型
  WIK_LISTEN : 0x20,			//听牌类型
  WIK_CHI_HU : 0x40,			//吃胡类型
  WIK_BU_HUA : 0x80,						//补花类型
}