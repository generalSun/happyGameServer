module.exports = function (app) {
  return new entryRemote(app);
};

var entryRemote = function (app) {
  this.app = app;
  this.sessionService = app.get('sessionService');
};

entryRemote.prototype.kick = function (args, cb) {
  this.app.sessionService.kick(args.uid, function () {
    cb();
  })
}

