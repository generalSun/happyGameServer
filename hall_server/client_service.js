var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var room_service = require("./room_service");
var db_users = require('./../dbList/users/db_users')
var db_rooms = require('./../dbList/rooms/db_rooms')
var db_games = require('./../dbList/games/db_games')
var db_gamesArchive = require('./../dbList/gamesArchive/db_gamesArchive')
var db_message = require('./../dbList/message/db_message')
var db_gameList = require('./../dbList/gameList/db_gameList')

var app = require('./../common/common_app')
var config = null;

function check_account(req,res){
	var account = req.query.account;
	var sign = req.query.sign;
	if(account == null || sign == null){
		http.send(res,1,"unknown error");
		return false;
	}
	var serverSign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
	if(serverSign != sign){
		http.send(res,2,"login failed.");
		return false;
	}
	return true;
}

//设置跨域访问
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

app.get('/login',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var ip = req.ip;
	if(ip.indexOf("::ffff:") != -1){
		ip = ip.substr(7);
	}
	var account = req.query.account;
	db_users.get_user_data_of_users(account,function(data){
		if(data == null){
			http.send(res,0,"ok");
			return;
		}
		var ret = {
			account:data.account,
			userId:data.userId,
			name:data.name,
			lv:data.lv,
			exp:data.exp,
			coins:data.coins,
			gems:data.gems,
			ip:ip,
			sex:data.sex,
		};
		db_users.set_user_online_of_users(ret.userId,1)
		var roomInfo = data.roomInfo
		if(roomInfo == null || roomInfo == ''){
			http.send(res,0,"ok",ret);
			return
		}
		roomInfo = JSON.parse(roomInfo)
		var ps = new Array()
		for(var roomId in roomInfo){
			var p = new Promise((resolve, reject) => {
				//检查房间是否存在于数据库中
				db_rooms.is_room_exist_of_rooms(roomId,function(retval,info){
					if(retval){
						var usersInfo = JSON.parse(info.usersInfo)
						var args = {
							usersInfo:usersInfo,
							roomId:roomId,
							userId:data.userId,
						}
						resolve(args)
					}else{
						//如果房间不在了，表示信息不同步，清除掉用户记录
						delete roomInfo[roomId]
						db_users.set_room_info_of_users(data.userId,roomInfo);
					}
				});
			})
            ps.push(p)
		}

		Promise.all(ps).then(function(args){
            for(var i = 0; i < args.length; i++){
				var arg = args[i]
				var usersInfo = arg.usersInfo
				var roomId = arg.roomId
				var userId = arg.userId
				for(var id in usersInfo){
					if(id == userId){
						ret.roomId = roomId;
						http.send(res,0,"ok",ret);
						return
					}
				}
			}
			http.send(res,0,"ok",ret);
        }).catch(function(err){
            cc.log(err.message || err);
        })
	});
});

app.get('/create_user',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var account = req.query.account;
	var name = req.query.name;
	var coins = 1000;
	var gems = 21;
	var headimg = null
	var sex = 0
	console.log('client_service create_user account:'+account+'   name:'+name);

	db_users.is_user_exist_of_users(account,function(ret){
		if(!ret){
			db_users.create_user_of_users(account,name,coins,gems,sex,headimg,function(ret){
				if (ret == null) {
					http.send(res,2,"system error.");
				}else{
					http.send(res,0,"ok");					
				}
			});
		}else{
			http.send(res,1,"account have already exist.");
		}
	});
});

app.get('/create_private_room',function(req,res){
	//验证参数合法性
	var data = req.query;
	//验证玩家身份
	if(!check_account(req,res)){
		return;
	}
	var account = data.account;
	var conf = data.conf;
	db_users.get_user_data_of_users(account,function(data){
		if(data == null){
			http.send(res,1,"system error");
			return;
		}
		var userId = data.userId;
		var name = data.name;
		var roomInfo = data.roomInfo || {}
		if(roomInfo.length > 0){
			for(var key in roomInfo){
				var info = roomInfo[key]
				if(info.field == 'private'){
					http.send(res,-1,"user is playing in room now.");
					return;
				}
			}
		}
		var createRoomInfo = {
			conf:conf,
			account:account,
			userId:userId,
			name:name
		}
		//创建房间
		room_service.createRoom(createRoomInfo,function(err,roomId){
			if(err == 0 && roomId != null){
				var enterRoomInfo = {
					userId:userId,
					roomId:roomId,
					name:name
				} 
				room_service.enterRoom(enterRoomInfo,function(errcode,enterInfo){
					console.log('client_service create_private_room enterRoom:')
					console.log(enterInfo)
					if(enterInfo){
						var ret = {
							roomId:roomId,
							ip:enterInfo.ip,
							port:enterInfo.port,
							token:enterInfo.token,
							time:Date.now()
						};
						ret.sign = crypto.md5(ret.roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
						http.send(res,0,"ok",ret);
					}else{
						http.send(res,errcode,"room doesn't exist.");
					}
				});
			}else{
				http.send(res,err,"create failed.");					
			}
		});
	});
});

app.get('/enter_private_room',function(req,res){
	var data = req.query;
	var roomId = data.roomId;
	if(roomId == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	if(!check_account(req,res)){
		return;
	}

	var account = data.account;

	db_users.get_user_data_of_users(account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var userId = data.userId;
		var name = data.name;
		var enterRoomInfo = {
			userId:userId,
			roomId:roomId,
			name:name
		}
		//进入房间
		room_service.enterRoom(enterRoomInfo,function(errcode,enterInfo){
			if(enterInfo){
				var ret = {
					roomId:roomId,
					ip:enterInfo.ip,
					port:enterInfo.port,
					token:enterInfo.token,
					time:Date.now()
				};
				ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
				http.send(res,0,"ok",ret);
			}
			else{
				http.send(res,errcode,"enter room failed.");
			}
		});
	});
});

app.get('/get_history_list',function(req,res){
	var data = req.query;
	if(!check_account(req,res)){
		return;
	}
	var account = data.account;
	db_users.get_user_data_of_users(account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var userId = data.userId;
		db_users.get_user_history_of_users(userId,function(history){
			http.send(res,0,"ok",{history:history});
		});
	});
});

app.get('/get_games_of_room',function(req,res){
	var data = req.query;
	var uuid = data.uuid;
	if(uuid == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	if(!check_account(req,res)){
		return;
	}
	db_gamesArchive.get_games_of_gamesArchive(uuid,function(data){
		console.log(data);
		http.send(res,0,"ok",{data:data});
	});
});

app.get('/get_detail_of_game',function(req,res){
	var data = req.query;
	var uuid = data.uuid;
	var index = data.index;
	if(uuid == null || index == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	if(!check_account(req,res)){
		return;
	}
	db_gamesArchive.get_detail_of_gamesArchive(uuid,index,function(data){
		http.send(res,0,"ok",{data:data});
	});
});

app.get('/get_user_status',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var account = req.query.account;
	db_users.get_gems_of_users(account,function(data){
		if(data != null){
			http.send(res,0,"ok",{gems:data.gems});	
		}else{
			http.send(res,1,"get gems failed.");
		}
	});
});

app.get('/get_message',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var type = req.query.type;
	
	if(type == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	
	var version = req.query.version;
	db_message.get_message_of_message(type,version,function(data){
		if(data != null){
			http.send(res,0,"ok",{msg:data.msg,version:data.version});	
		}
		else{
			http.send(res,1,"get message failed.");
		}
	});
});

app.get('/get_gameList',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	db_gameList.get_gameList_of_gameList(function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		http.send(res,0,"ok",{data:data});
	});
});

exports.start = function($config){
	config = $config;
	app.listen(config.CLEINT_PORT);
	console.log("client service is listening on port " + config.CLEINT_PORT);
};