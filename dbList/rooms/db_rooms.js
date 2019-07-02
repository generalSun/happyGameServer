var db = require('../../utils/db');

function nop(a,b,c,d,e,f,g){

}

exports.is_room_exist_of_rooms = function(roomId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT * FROM t_rooms WHERE roomId = "' + roomId + '"';
    console.log(sql)
    db.query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }else{
            callback(rows.length > 0,rows[0]);
        }
    });
};

exports.create_room_of_rooms = function(roomId,conf,ip,port,create_time,callback){
    callback = callback == null? nop:callback;
    var sql = "INSERT INTO t_rooms(uuid,roomId,base_info,ip,port,create_time) \
                VALUES('{0}','{1}','{2}','{3}','{4}','{5}')";
    var uuid = Date.now() + roomId;
    var baseInfo = JSON.stringify(conf);
    sql = sql.format(uuid,roomId,baseInfo,ip,port,create_time);
    console.log(sql);
    db.query(sql,function(err,row,fields){
        if(err){
            callback(null);
            throw err;
        }else{
            callback(uuid);
        }
    });
};

exports.get_room_data_of_rooms = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_rooms WHERE roomId = "' + roomId + '"';
    db.query(sql, function(err, rows, fields) {
        if(err){
            callback(null);
            throw err;
        }
        if(rows.length > 0){
            // rows[0].user_name0 = crypto.fromBase64(rows[0].user_name0);
            // rows[0].user_name1 = crypto.fromBase64(rows[0].user_name1);
            // rows[0].user_name2 = crypto.fromBase64(rows[0].user_name2);
            // rows[0].user_name3 = crypto.fromBase64(rows[0].user_name3);
            callback(rows[0]);
        }else{
            callback(null);
        }
    });
};

exports.get_room_uuid_of_rooms = function(roomId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT uuid FROM t_rooms WHERE roomId = "' + roomId + '"';
    db.query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            throw err;
        }
        else{
            callback(rows[0].uuid);
        }
    });
};

exports.set_seat_info_of_rooms = function(roomId,info,callback){
    callback = callback == null? nop:callback;
    info = info || {}
    info = JSON.stringify(info);
    var sql = "UPDATE t_rooms SET usersInfo = '"+ info +"' WHERE roomId = '" + roomId + "'";
    console.log(sql);
    db.query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(rows.length > 0);
        }
    });
};

exports.get_seat_info_of_rooms = function(roomId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT usersInfo FROM t_rooms WHERE roomId = "' + roomId + '"';
    console.log(sql);
    db.query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            throw err;
        }else{
            if(rows.length == 0){
                callback(null);
                return
            }
            var info = rows[0].usersInfo;
            if(info == null || info == ""){
                callback(null);    
            }else{
                info = JSON.parse(info);
                console.log('get_seat_info_of_rooms :')
                console.log(info)
                callback(info);
            }      
        }
    });
}

exports.get_room_addr_of_rooms = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(false,null,null);
        return;
    }

    var sql = 'SELECT ip,port FROM t_rooms WHERE roomId = "' + roomId + '"';
    db.query(sql, function(err, rows, fields) {
        if(err){
            callback(false,null,null);
            throw err;
        }
        if(rows.length > 0){
            callback(true,rows[0].ip,rows[0].port);
        }else{
            callback(false,null,null);
        }
    });
};

exports.delete_room_of_rooms = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(false);
    }
    var sql = "DELETE FROM t_rooms WHERE roomId = '{0}'";
    sql = sql.format(roomId);
    console.log(sql);
    db.query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
}