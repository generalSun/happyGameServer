var db = require('../../utils/db');

function nop(a,b,c,d,e,f,g){

}

function generateUserId() {
    var Id = "";
    for (var i = 0; i < 6; ++i) {
        if (i > 0) {
            Id += Math.floor(Math.random() * 10);
        } else {
            Id += Math.floor(Math.random() * 9) + 1;
        }
    }
    return Id;
}

exports.is_user_exist_of_users = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(false);
        return;
    }

    var sql = 'SELECT userId FROM t_users WHERE account = "' + account + '"';
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }else{
            if(rows.length > 0){
                callback(true);
            }else{
                callback(false);
            }
        }
    });  
}

exports.create_user_of_users = function(account,name,coins,gems,sex,headimg,callback){
    callback = callback == null? nop:callback;
    if(account == null || name == null || coins==null || gems==null){
        callback(false);
        return;
    }
    if(headimg){
        headimg = '"' + headimg + '"';
    }else{
        headimg = 'null';
    }
    // name = crypto.toBase64(name);
    var userId = generateUserId();
    var sql = 'INSERT INTO t_users(userId,account,name,coins,gems,sex,headimg,online) VALUES("{0}","{1}","{2}","{3}","{4}","{5}","{6}","{7}")';
    sql = sql.format(userId,account,name,coins,gems,sex,headimg,1);
    console.log(sql);
    db.query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(true);
    });
};

exports.update_user_info_of_users = function(account,name,headimg,sex,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }
 
    if(headimg){
        headimg = '"' + headimg + '"';
    }else{
        headimg = 'null';
    }
    // name = crypto.toBase64(name);
    var sql = 'UPDATE t_users SET name="{0}",headimg={1},sex={2},online={3} WHERE account="{4}"';
    sql = sql.format(name,headimg,sex,1,account);
    console.log(sql);
    db.query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(rows);
    });
};

exports.get_user_base_info_of_users = function(userId,callback){
    callback = callback == null? nop:callback;
    if(userId == null){
        callback(null);
        return;
    }
    var sql = 'SELECT name,sex,headimg FROM t_users WHERE userId={0}';
    sql = sql.format(userId);
    console.log(sql);
    db.query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        // rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.get_user_data_by_userid_of_users = function(userId,callback){
    callback = callback == null? nop:callback;
    if(userId == null){
        callback(null);
        return;
    }

    var sql = 'SELECT userId,account,name,lv,exp,coins,gems FROM t_users WHERE userId = ' + userId;
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        // rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

/**增加玩家房卡 */
exports.add_user_gems_of_users = function(userId,gems,callback){
    callback = callback == null? nop:callback;
    if(userId == null){
        callback(false);
        return;
    }
    
    var sql = 'UPDATE t_users SET gems = gems +' + gems + ' WHERE userId = ' + userId;
    console.log(sql);
    db.query(sql,function(err,rows,fields){
        if(err){
            console.log(err);
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows > 0);
            return; 
        } 
    });
};

exports.get_user_data_of_users = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_users WHERE account = "' + account + '"';
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        // rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.set_room_info_of_users = function(userId,info,callback){
    callback = callback == null? nop:callback;
    info = info || {}
    info = JSON.stringify(info);
    var sql = "UPDATE t_users SET roomInfo = '"+ info +"' WHERE userId = '" + userId + "'";
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

exports.get_gems_of_users = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }

    var sql = 'SELECT gems FROM t_users WHERE account = "' + account + '"';
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
}; 

exports.get_user_online_of_users = function(userId,callback){
    callback = callback == null? nop:callback;
    if(userId == null){
        callback(null);
        return;
    }

    var sql = 'SELECT online FROM t_users WHERE userId = "' + userId + '"';
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        // rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.set_user_online_of_users = function(userId,online,callback){
    callback = callback == null? nop:callback;
    if(userId == null){
        callback(null);
        return;
    }

    var sql = "UPDATE t_users SET online = '" + online + "' WHERE userId = '" + userId + "'";
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        // rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.get_user_history_of_users = function(userId,callback){
    callback = callback == null? nop:callback;
    if(userId == null){
        callback(null);
        return;
    }

    var sql = 'SELECT history FROM t_users WHERE userId = "' + userId + '"';
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        var history = rows[0].history;
        if(history == null || history == ""){
            callback(null);    
        }
        else{
            console.log(history.length);
            history = JSON.parse(history);
            callback(history);
        }        
    });
};

exports.update_user_history = function(userId,history,callback){
    callback = callback == null? nop:callback;
    if(userId == null || history == null){
        callback(false);
        return;
    }

    history = JSON.stringify(history);
    var sql = 'UPDATE t_users SET history = \'' + history + '\' WHERE userId = "' + userId + '"';
    //console.log(sql);
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }

        if(rows.length == 0){
            callback(false);
            return;
        }

        callback(true);
    });
};

exports.cost_gems = function(userId,cost,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_users SET gems = gems -' + cost + ' WHERE userId = ' + userId;
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

exports.get_room_info_of_users = function(userId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT roomInfo FROM t_users WHERE userId = "' + userId + '"';
    console.log(sql)
    db.query(sql, function(err, rows, fields) {
        if(err){
            callback(null);
            throw err;
        }else{
            if(rows.length == 0){
                callback(null);
                return
            }
            var info = rows[0].roomInfo;
            if(info == null || info == ""){
                callback(null);    
            }else{
                info = JSON.parse(info);
                console.log(info)
                callback(info);
            }      
        }
    });
};
