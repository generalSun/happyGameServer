const IORedis = require("ioredis");
const gameConfig = require("../../../config/configuration");
const logger = require('pomelo-logger').getLogger('redis');
Redis = function () {};
module.exports = Redis;
let app = require('pomelo').app;

Redis.initAll = function (pomeloApp) {
  let redisDB = gameConfig.redis.db;
  //app = pomeloApp;

  for (let key in redisDB) {
    Redis.init(key, redisDB[key], gameConfig.redis);
  }
}

Redis.init = function (key, db, redisConfig) {
  let currentRedis = new IORedis({
    port: 6379, // Redis port
    host: redisConfig.url, // Redis host
    family: 4, // 4 (IPv4) or 6 (IPv6)
    password: redisConfig.password,
    db
  });

  app[key] = currentRedis;
  currentRedis.on("error", function (error) {
    if (error) {
      logger.error('redis error', error);
    }
  });

  currentRedis.on("connect", async function () {
    // if (app.serverId == 'hall-1') { //在配置redis片中初始化信息
    //   await currentRedis.flushdb();
    // }
  });

  currentRedis.getObj = function (uid) {
    return currentRedis.hgetall(uid)
      .then((res) => {
        if (res && Object.keys(res).length == 0) {
          res = null;
        }
        return Promise.resolve(res);
      })
      .catch((error) => {
        logger.error('currentRedis.getObj 出错', {
          error,
          uid
        });
        return Promise.reject({
          code: -500,
          msg: "查询redis数据库出错"
        }); // redis获取数据失败
      })
  };
  currentRedis.setObj = function (obj) {
    logger.info('currentRedis.setObj',obj);
    return currentRedis.hmset(obj.uid, obj)
      .catch((error) => {
        logger.error('currentRedis.saveOrUpdateObj 出错', {
          error,
          obj
        });
        return Promise.reject({
          code: -500,
          msg: "redis 存储数据失败"
        }); // redis数据库更新失败
      })
  };
}