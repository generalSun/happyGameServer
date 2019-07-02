var crypto = require('../utils/crypto');
var express = require('express');
var http = require("../utils/http");
var db_users = require('./../dbList/users/db_users')

var app = require('./../common/common_app')

function send(res,ret){
	var str = JSON.stringify(ret);
	res.send(str)
}


exports.start = function(config){
	app.listen(config.DEALDER_API_PORT,config.DEALDER_API_IP);
	console.log("dealer api is listening on " + config.DEALDER_API_IP + ":" + config.DEALDER_API_PORT);
};

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.get('/get_user_info',function(req,res){
	var userId = req.query.userId;
	db_users.get_user_data_by_userid_of_users(userId,function (data) {
		if(data){
			var ret = {
				userId:userId,
				name:data.name,
				gems:data.gems,
				headimg:data.headimg
			}
			http.send(res,0,"ok",ret);
		}else{
			http.send(res,1,"null");
		}
	});
});

app.get('/add_user_gems',function(req,res){
	var userId = req.query.userId;
	var gems = req.query.gems;
	db_users.add_user_gems_of_users(userId,gems,function(suc){
		if(suc){
			http.send(res,0,"ok");
		}else{
			http.send(res,1,"failed");
		}
	});
});