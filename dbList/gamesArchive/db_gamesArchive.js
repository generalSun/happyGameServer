var db = require('../../utils/db');

function nop(a,b,c,d,e,f,g){

}

exports.get_games_of_gamesArchive = function(room_uuid,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null){
        callback(null);
        return;
    }

    var sql = 'SELECT game_index,create_time,result FROM t_games_archive WHERE room_uuid = "' + room_uuid + '"';
    //console.log(sql);
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }

        callback(rows);
    });
};

exports.get_detail_of_gamesArchive = function(room_uuid,index,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null || index == null){
        callback(null);
        return;
    }
    var sql = 'SELECT base_info,action_records FROM t_games_archive WHERE room_uuid = "' + room_uuid + '" AND game_index = ' + index ;
    //console.log(sql);
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        callback(rows[0]);
    });
}

exports.archive_games = function(room_uuid,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null){
        callback(false);
    }
    var sql = "INSERT INTO t_games_archive(SELECT * FROM t_games WHERE room_uuid = '{0}')";
    sql = sql.format(room_uuid);
    console.log(sql);
    db.query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            exports.delete_games(room_uuid,function(ret){
                callback(ret);
            });
        }
    });
}