var crypto = require('../utils/crypto');
var express = require('express');
var http = require('../utils/http');
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var tokenMgr = require("./tokenmgr");

var app = require('../common/common_app')
var config = null;

var serverIp = "";

//测试
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

app.get('/get_server_info',function(req,res){
	var serverId = req.query.serverid;
	var sign = req.query.sign;
	if(serverId  != config.SERVER_ID || sign == null){
		http.send(res,1,"invalid parameters");
		return;
	}

	var md5 = crypto.md5(serverId + config.ROOM_PRI_KEY);
	if(md5 != sign){
		http.send(res,1,"sign check failed.");
		return;
	}

	var locations = roomMgr.getUserLocations();
	var arr = [];
	for(var userId in locations){
		var roomId = locations[userId].roomId;
		arr.push(userId);
		arr.push(roomId);
	}
	http.send(res,0,"ok",{userroominfo:arr});
});

app.get('/create_room',function(req,res){
	var userId = parseInt(req.query.userId);
	var sign = req.query.sign;
	var gems = req.query.gems;
	var conf = req.query.conf
	var name = req.query.name
	console.log('http_service create_room:')
	if(userId == null || sign == null || conf == null){
		http.send(res,1,"invalid parameters");
		return;
	}

	var md5 = crypto.md5(userId + conf + gems + config.ROOM_PRI_KEY);
	if(md5 != req.query.sign){
		http.send(res,1,"sign check failed.");
		return;
	}
	
	conf = JSON.parse(conf);
	var createRoomInfo = {
		userId:userId,
		conf:conf,
		gems:gems,
		ip:serverIp,
		port:config.CLIENT_PORT,
		name:name
	}
	console.log(createRoomInfo)
	roomMgr.createRoom(createRoomInfo,function(errcode,roomId){
		if(errcode != 0 || roomId == null){
			http.send(res,errcode,"create failed.");
			return;	
		}else{
			http.send(res,0,"ok",{roomId:roomId});			
		}
	});
});

app.get('/enter_room',function(req,res){
	var userId = parseInt(req.query.userId);
	var name = req.query.name;
	var roomId = req.query.roomId;
	var sign = req.query.sign;
	if(userId == null || roomId == null || sign == null){
		http.send(res,1,"invalid parameters");
		return;
	}

	var md5 = crypto.md5(userId + name + roomId + config.ROOM_PRI_KEY);
	if(md5 != sign){
		http.send(res,2,"sign check failed.");
		return;
	}
	var enterRoomInfo = {
		userId:userId,
		roomId:roomId,
		name:name
	}
	//安排玩家坐下
	roomMgr.enterRoom(enterRoomInfo,function(ret){
		console.log('http_service enter_room:')
		console.log(ret)//res code 0正常 3未找到房间 4已满 2已在房间中
		if(ret == 0){
			roomMgr.userInRoom(enterRoomInfo,function(state){
				if(state == 0){
					var token = tokenMgr.createToken(userId,5000);
					http.send(res,0,"ok",{token:token});
				}else{
					http.send(res,1,"room has full.");
				}
			})
		}else if(ret == 2){
			http.send(res,3,"can't find room.");
		}else if(ret == 1){
			http.send(res,2,"has in room.");
		}
	});
});

app.get('/is_room_runing',function(req,res){
	var roomId = req.query.roomId;
	var sign = req.query.sign;
	if(roomId == null || sign == null){
		http.send(res,1,"invalid parameters");
		return;
	}

	var md5 = crypto.md5(roomId + config.ROOM_PRI_KEY);
	if(md5 != sign){
		http.send(res,2,"sign check failed.");
		return;
	}
	
	//var roomInfo = roomMgr.getRoom(roomId);
	http.send(res,0,"ok",{runing:true});
});

var gameServerInfo = null;
var lastTickTime = 0;

//向大厅服定时心跳
function update(){
	if(lastTickTime + config.HTTP_TICK_TIME < Date.now()){
		lastTickTime = Date.now();
		gameServerInfo.load = roomMgr.getTotalRooms();
		http.get(config.HALL_IP,config.HALL_PORT,"/register_gs",gameServerInfo,function(ret,data){
			if(ret == true){
				if(data.errcode != 0){
					console.log(data.errmsg);
				}
				
				if(data.ip != null){
					serverIp = data.ip;
				}
			}else{
				//
				lastTickTime = 0;
			}
		});

		var mem = process.memoryUsage();
		var format = function(bytes) {  
              return (bytes/1024/1024).toFixed(2)+'MB';  
        }; 
	}
}

exports.start = function($config){
	config = $config;

	//
	gameServerInfo = {
		id:config.SERVER_ID,
		clientip:config.CLIENT_IP,
		clientport:config.CLIENT_PORT,
		httpPort:config.HTTP_PORT,
		load:roomMgr.getTotalRooms(),
	};

	setInterval(update,1000);
	app.listen(config.HTTP_PORT,config.FOR_HALL_IP);
	console.log("game server is listening on " + config.FOR_HALL_IP + ":" + config.HTTP_PORT);
};