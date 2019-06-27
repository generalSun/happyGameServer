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
	console.log('constructRoomFromDb : ')
	console.log(dbdata)
	var roomInfo = {
		uuid:dbdata.uuid,
		id:dbdata.id,
		num_of_turns:dbdata.num_of_turns,
		createTime:dbdata.create_time,
		currentPlayingIndex:dbdata.currentPlayingIndex,
		room_state:dbdata.room_state,
		seats:new Array(4),
		conf:JSON.parse(dbdata.base_info)
	};

	roomInfo.gameMgr = require('./../gameList/'+roomInfo.conf.type+"/gamemgr_"+roomInfo.conf.type)
	roomInfo.socketMgr = require('./../gameList/'+roomInfo.conf.type+"/"+roomInfo.conf.type+"_socket")
	var roomId = roomInfo.id;

	for(var i = 0; i < 4; ++i){
		var s = roomInfo.seats[i] = {};
		s.userId = dbdata["user_id" + i];
		s.score = dbdata["user_score" + i];
		s.name = dbdata["user_name" + i];
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
			db.get_room_info_of_user(userId,function(data){
				if(data){
					delete data[roomId]
					db.set_room_info_of_user(userId,data);
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

exports.enterRoom = function(enterRoomInfo,callback){
	enterRoomInfo = enterRoomInfo || {}
	var userId = enterRoomInfo.userId
	var roomId = enterRoomInfo.roomId
	var name = enterRoomInfo.name
	var fnTakeSeat = function(room){
		if(exports.getUserRoom(userId) == roomId){
			//已存在
			return 0;
		}
		for(var i = 0; i < room.conf.playerMaxNum; ++i){
			var seat = room.seats[i];
			if(seat.userId <= 0){
				seat.userId = userId;
				seat.name = name;
				userLocation[userId] = {
					roomId:roomId,
					seatIndex:i
				};
				db.get_seat_info_of_rooms(roomId,function(ret){
					if(ret == null){
						ret = {}
					}
					var userInfo = {
						userId:userId,
						seatIndex:i,
						name:name
					}
					ret[userId] = userInfo
					console.log('roommgr enterRoom:')
					console.log(ret)
					db.set_seat_info_of_rooms(roomId,ret)
				});
				//正常
				return 0;
			}
		}	
		//房间已满
		return 1;	
	}
	var room = rooms[roomId];
	if(room){
		var ret = fnTakeSeat(room);
		callback(ret);
	}else{
		db.get_room_data(roomId,function(dbdata){
			if(dbdata == null){
				//找不到房间
				callback(2);
			}else{
				//construct room.
				room = constructRoomFromDb(dbdata);
				//
				var ret = fnTakeSeat(room);
				callback(ret);
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
	db.get_room_info_of_user(userId,function(data){
		if(data){
			for(var i = 0; i < data.length; i++){
				var info = data[i]
				if(roomId == info.roomId){
					if(info.field == 'private'){
						delete data[roomId]
					}
					break
				}
			}
			db.set_room_info_of_user(userId,data);
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
		}
		else{
			creatingRooms[roomId] = true;
			db.is_room_exist(roomId, function(ret) {
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
							rule:roomConf.rule
						});
					}
					
					//写入数据库
					db.create_room(roomInfo.id,roomInfo.conf,ip,port,createTime,function(uuid){
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