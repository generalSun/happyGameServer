const pomelo = require('pomelo');
const routeUtil = require('./app/util/routeUtil');
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'pomeloServer');

app.configure('production|staging|development', 'gate', function () {
  app.set('connectorConfig', {
    connector: pomelo.connectors.hybridconnector,
    useDict: false
  });
  app.event.addListener("start_all", function () {
    app.startOver = true;
  });
});

// app configuration
app.configure('production|development', 'connector', function () {
  app.set('connectorConfig', {
    connector: pomelo.connectors.hybridconnector,
    heartbeat: 3,
    useDict: true,
    useProtobuf: true
  });
  app.event.addListener("start_all", function () {
    app.startOver = true;
    app.userStatus.flushdb();
  });
});

app.configure('production|development', 'connector|hall|room|auth', function () {
  app.db = require('./app/appserver/dao/dbfun');
  app.db.initConnect();
  app.redis = require('./app/appserver/dao/redisconnect');
  app.redis.initAll(app);
  // routeUtil.init();
  // app.route('auth', routeUtil.auth);
  // app.route('hall', routeUtil.hall);
  // app.route('room', routeUtil.room);
});

app.configure('production|development', 'hall', function () {
  app.service = require('./app/appserver/hall/hallServices');
});

app.configure('production|development', 'room', function () {
  app.service = require('./app/appserver/room/roomServices');
  app.service.initRoom();
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});