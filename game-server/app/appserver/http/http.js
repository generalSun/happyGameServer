const express = require('express');
const bodyParser = require('body-parser');
const logger = require('pomelo-logger').getLogger('common');
const cors = require('cors');
const SmsMsg = require('./SmsMsg');
///////////////////////////////////////////////
//http服务
///////////////////////////////////////////////
class CHttp {
  constructor(port) {
    this.init(port);
  }
}

CHttp.prototype.init = function (port) {
  let app = express();
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(bodyParser.text({ type: 'text/xml' }));

  app.use(function (req, res, next) {
    if (req.method == 'GET') {
      logger.info(req.method, req.path, req.query);
    }
    if (req.method == 'POST') {
      logger.info(req.method, req.path, req.body);
    }
    next();
  });

  app.use('/SmsMsg', SmsMsg);
  let server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('listening at http://%s:%s', host, port);
  });
}

module.exports = CHttp;