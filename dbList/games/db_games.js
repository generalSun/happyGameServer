var db = require('../../utils/db');

function nop(a,b,c,d,e,f,g){

}

exports.is_game_exist_of_games = function(roomId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT * FROM t_games WHERE roomId = "' + roomId + '"';
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

exports.create_game_of_games = function(roomId,index,base_info,callback){
    callback = callback == null? nop:callback;
    var sql = "INSERT INTO t_games(roomId,num_of_turns,base_info,start_time) VALUES('{0}',{1},'{2}',unix_timestamp(now()))";
    sql = sql.format(roomId,index,base_info);
    //console.log(sql);
    db.query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            throw err;
        }
        else{
            callback(rows.insertId);
        }
    });
};

exports.delete_games = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(false);
    }    
    var sql = "DELETE FROM t_games WHERE roomId = '{0}'";
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

exports.update_game_action_records = function(roomId,index,actions,callback){
    callback = callback == null? nop:callback;
    var sql = "UPDATE t_games SET action_records = '"+ actions +"' WHERE roomId = '" + roomId + "' AND num_of_turns = " + index ;
    //console.log(sql);
    db.query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};

exports.update_game_result = function(roomId,index,result,callback){
    callback = callback == null? nop:callback;
    if(roomId == null || result){
        callback(false);
    }
    
    result = JSON.stringify(result);
    var sql = "UPDATE t_games SET result = '"+ result +"' WHERE roomId = '" + roomId + "' AND num_of_turns = " + index ;
    //console.log(sql);
    db.query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};

exports.update_num_of_turns_of_games = function(roomId,numOfTurns,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_games SET num_of_turns = {0} WHERE id = "{1}"'
    sql = sql.format(numOfTurns,roomId);
    //console.log(sql);
    db.query(sql,function(err,row,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};

exports.update_currentPlayingIndex_of_games = function(roomId,currentPlayingIndex,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_games SET currentPlayingIndex = {0} WHERE id = "{1}"'
    sql = sql.format(currentPlayingIndex,roomId);
    //console.log(sql);
    db.query(sql,function(err,row,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};