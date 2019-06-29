var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var FileStreamRotator = require('file-stream-rotator')

var path = require('path')
var fs = require('fs');
var logDirectory = path.join(__dirname, 'logs')

var app = express();

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogfile = FileStreamRotator.getStream({
    date_format: 'YYYY-MM-DD',
    filename: path.join(logDirectory, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false
})

var errorLogfile = FileStreamRotator.getStream({
    date_format: 'YYYY-MM-DD',
    filename: path.join(logDirectory, 'error-%DATE%.log'),
    frequency: 'daily',
    verbose: false
})

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

// 自定义token
logger.token('from', function(req, res){
    return '\nfrom :'+JSON.stringify(req.query) || '-';
});

logger.token('time', function(req, res){
    return new Date().Format("yyyy-MM-dd hh:mm:ss") + '\n'; 
});

logger.token('nextROw', function(req, res){
    return "\r\n"; 
});

// 自定义format，其中包含自定义的token
logger.format('joke', '[joke] :time :remote-addr :remote-user :method :url :from :status :referrer :response-time ms :user-agent :nextROw');

//跳过不需要记录的请求
var skip = function(req,res) {
    // return (req.url).indexOf('stylesheets') != -1
    return (req.url).indexOf('register_gs') != -1
}

// 使用自定义的format
app.use(logger('joke',{skip: skip, immediate:true}));
app.use(logger('joke',{skip: skip, stream: accessLogfile, immediate:true})); //打印到日志文件中  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    var now = new Date();
    var time = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + ' '
        + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
    var meta = '[' + time + '] '+req.method+' ' + req.url + '\r\n';
    errorLogfile.write(meta + err.stack + '\r\n\r\n\r\n');
    next();
});

module.exports = app;