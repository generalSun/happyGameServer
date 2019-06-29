var db = require('../utils/db');
var constants = require('./config/constants')
var rooms = {};
var creatingRooms = {};

var userLocation = {};
var totalRooms = 0;

var DI_FEN = [1,2,5];
var MAX_FAN = [3,4,5];
var JU_SHU = [4,8,16];
var JU_SHU_COST = [2,3,4];

function generateRoomId(first){
	first = first.toString() || '1'
	var roomId = first;
	for(var i = 0; i < 5; ++i){
		roomId += Math.floor(Math.random()*10);
	}
	return roomId;
}

function constructRoomFromDb(dbdata){
	console.log('constructRoomFromDb:')
	console.log(dbdata)
	var roomInfo = {
		uuid:dbdata.uuid,
		id:dbdata.id,
		num_of_turns:dbdata.num_of_turns,
		createTime:dbdata.create_time,
		currentPlayingIndex:dbdata.currentPlayingIndex,
		room_state:dbdata.room_state,
		seats:new Array(),
		conf:JSON.parse(dbdata.base_info)
	};
	
	roomInfo.gameMgr = require('./../gameList/'+roomInfo.conf.type+"/gamemgr_"+roomInfo.conf.type)
	roomInfo.socketMgr = require('./../gameList/'+roomInfo.conf.type+"/"+roomInfo.conf.type+"_socket")
	
	var roomId = roomInfo.id;
	var usersInfo = JSON.parse(dbdata.usersInfo)
	for(var i = 0; i < roomInfo.conf.playerMaxNum; ++i){
		var s = roomInfo.seats[i] = {};
		for(var key in usersInfo){
			var info = usersInfo[key]
			if(info.seatIndex == i){
				s.userId = info.userId
				s.score = info.score
				s.name = info.name
				break
			}
		}
		s.online = 0
		s.ready = false;
		s.seatIndex = i;

		if(s.userId > 0){
			userLocation[s.userId] = {
				roomId:roomId,
				seatIndex:i
			};
		}
	}
	rooms[roomId] = roomInfo;
	totalRooms++;
	return roomInfo;
}

exports.destroy = function(roomId){
	var roomInfo = rooms[roomId];
	if(roomInfo == null){
		return;
	}

	for(var i = 0; i < roomInfo.playerMaxNum; ++i){
		var userId = roomInfo.seats[i].userId;
		if(userId > 0){
			delete userLocation[userId];
			db.get_room_info_of_users(userId,function(data){
				if(data){
					delete data[roomId]
					db.set_room_info_of_users(userId,data);
				}
			});
		}
	}
	
	delete rooms[roomId];
	totalRooms--;
	db.delete_room(roomId);
}

exports.getTotalRooms = function(){
	return totalRooms;
}

exports.getRoom = function(roomId){
	return rooms[roomId];
};

exports.isCreator = function(roomId,userId){
	var roomInfo = rooms[roomId];
	if(roomInfo == null){
		return false;
	}
	return roomInfo.conf.creator == userId;
};

exports.userInRoom = function(enterRoomInfo,callback){
	enterRoomInfo = enterRoomInfo || {}
	var userId = enterRoomInfo.userId
	var roomId = enterRoomInfo.roomId
	var name = enterRoomInfo.name
	db.get_seat_info_of_rooms(roomId,function(ret){
		console.log('roommgr userInRoom:')
		console.log(ret)
		if(ret == null){
			ret = {}
		}
		var hasFind = false
		var room = rooms[roomId];
		for(var key in ret){
			if(userId == key){
				hasFind = true
			}
			var seatIndex = ret[key].seatIndex
			var seat = room.seats[seatIndex];
			seat.userId = key;
			seat.name = ret[key].name;
			seat.score = ret[key].score;
			seat.seatIndex = seatIndex
			userLocation[key] = {
				roomId:roomId,
				seatIndex:seatIndex
			};
		}
		if(!hasFind){
			for(var i = 0; i < room.conf.playerMaxNum; ++i){
				var seat = room.seats[i];
				if(seat.userId <= 0){
					seat.userId = userId;
					seat.name = name;
					seat.online = 1
					userLocation[userId] = {
						roomId:roomId,
						seatIndex:i
					};
					var userInfo = {
						userId:userId,
						seatIndex:i,
						name:name,
						score:0
					}
					ret[userId] = userInfo
					hasFind = true
					db.set_seat_info_of_rooms(roomId,ret)
					break
				}
			}
		}
		
		if(hasFind){
			if(callback){
				callback(0)
			}
		}else{
			if(callback){
				callback(1)
			}
		}
	});
};

exports.enterRoom = function(enterRoomInfo,callback){
	enterRoomInfo = enterRoomInfo || {}
	var userId = enterRoomInfo.userId
	var roomId = enterRoomInfo.roomId
	var name = enterRoomInfo.name
	var room = rooms[roomId];
	if(room){
		if(exports.getUserRoom(userId) == roomId){
			console.log('已在房间中!')
			callback(1);
		}else{
			console.log('将要进入房间中!')
			callback(0);
		}
	}else{
		db.get_room_data_of_rooms(roomId,function(dbdata){
			if(dbdata == null){
				console.log('找不到房间!')
				callback(2);
			}else{
				console.log('将要进入房间中!')
				constructRoomFromDb(dbdata);
				callback(0);
			}
		});
	}
};

exports.setReady = function(userId,value){
	var roomId = exports.getUserRoom(userId);
	if(roomId == null){
		return;
	}

	var room = exports.getRoom(roomId);
	if(room == null){
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if(seatIndex == null){
		return;
	}

	var s = room.seats[seatIndex];
	s.ready = value;
}

exports.isReady = function(userId){
	var roomId = exports.getUserRoom(userId);
	if(roomId == null){
		return;
	}

	var room = exports.getRoom(roomId);
	if(room == null){
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if(seatIndex == null){
		return;
	}

	var s = room.seats[seatIndex];
	return s.ready;	
}

exports.getUserRoom = function(userId){
	var location = userLocation[userId];
	if(location != null){
		return location.roomId;
	}
	return null;
};

exports.leaveRoom = function(userId){
	var location = userLocation[userId];
	if(location == null)
		return;
	delete userLocation[userId];
};

exports.getUserSeat = function(userId){
	var location = userLocation[userId];
	//console.log(userLocation[userId]);
	if(location != null){
		return location.seatIndex;
	}
	return null;
};

exports.getUserLocations = function(){
	return userLocation;
};

exports.exitRoom = function(userId){
	var location = userLocation[userId];
	if(location == null)
		return;

	var roomId = location.roomId;
	var seatIndex = location.seatIndex;
	var room = rooms[roomId];
	delete userLocation[userId];
	if(room == null || seatIndex == null) {
		return;
	}

	var seat = room.seats[seatIndex];
	seat.userId = 0;
	seat.name = "";

	var numOfPlayers = 0;
	for(var i = 0; i < room.seats.length; ++i){
		if(room.seats[i].userId > 0){
			numOfPlayers++;
		}
	}
	db.get_room_info_of_users(userId,function(data){
		if(data){
			var hasFind = false
			for(var i = 0; i < data.length; i++){
				var info = data[i]
				if(roomId == info.roomId){
					if(info.field == 'private'){
						delete data[roomId]
						hasFind = true
					}
					break
				}
			}
			if(hasFind){
				db.set_room_info_of_users(userId,data);
			}
		}
	});

	if(numOfPlayers == 0){
		exports.destroy(roomId);
	}
};

exports.createRoom = function(createRoomInfo,callback){
	createRoomInfo = createRoomInfo || {}
	var creator = createRoomInfo.userId
	var roomConf = createRoomInfo.conf
	var gems = createRoomInfo.gems
	var ip = createRoomInfo.ip
	var port = createRoomInfo.port
	var name = createRoomInfo.name
	console.log('game_server createRoomInfo:')
	console.log(createRoomInfo)
	if(
		roomConf.type == null
		|| roomConf.rule == null
		|| roomConf.difen == null
		|| roomConf.jushuxuanze == null){
		callback(1,null);
		return;
	}

	if(roomConf.difen < 0 || roomConf.difen > DI_FEN.length){
		callback(1,null);
		return;
	}

	if(roomConf.jushuxuanze < 0 || roomConf.jushuxuanze > JU_SHU.length){
		callback(1,null);
		return;
	}
	
	var cost = JU_SHU_COST[roomConf.jushuxuanze];
	if(cost > gems){
		callback(2222,null);
		return;
	}

	var playerMaxNum = roomConf.playerMaxNum || 3

	var fnCreate = function(){
		var roomId = generateRoomId(1);
		if(rooms[roomId] != null || creatingRooms[roomId] != null){
			fnCreate();
		}else{
			creatingRooms[roomId] = true;
			db.is_room_exist_of_rooms(roomId, function(ret) {
				if(ret){
					delete creatingRooms[roomId];
					fnCreate();
				}else{
					var createTime = Math.ceil(Date.now()/1000);
					var roomInfo = {
						uuid:"",
						id:roomId,
						num_of_turns:0,
						createTime:createTime,
						currentPlayingIndex:0,
						room_state:constants.ROOM_state.idel,
						seats:[],
						conf:{
							type:roomConf.type,
							baseScore:DI_FEN[roomConf.difen],
						    maxGames:JU_SHU[roomConf.jushuxuanze],
							creator:creator,
							playerMaxNum:playerMaxNum,
							rule:roomConf.rule
						}
					};
					
					roomInfo.gameMgr = require('./../gameList/'+roomConf.type+"/gamemgr_"+roomConf.type)
					roomInfo.socketMgr = require('./../gameList/'+roomConf.type+"/"+roomConf.type+"_socket")
					console.log('createRoom roomInfo:');
					console.log(roomInfo);
					
					for(var i = 0; i < playerMaxNum; ++i){
						roomInfo.seats.push({
							userId:0,
							score:0,
							name:"",
							ready:false,
							seatIndex:i,
							online:0
						});
					}
					
					//写入数据库
					db.create_room_of_rooms(roomInfo.id,roomInfo.conf,ip,port,createTime,function(uuid){
						delete creatingRooms[roomId];
						if(uuid != null){
							roomInfo.uuid = uuid;
							console.log(uuid);
							rooms[roomId] = roomInfo;
							totalRooms++;
							callback(0,roomId);
						}else{
							callback(3,null);
						}
					});
				}
			});
		}
	}

	fnCreate();
};