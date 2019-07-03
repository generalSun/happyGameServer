var db = require('../../utils/db');

function nop(a,b,c,d,e,f,g){

}

exports.is_account_exist_of_account = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(false);
        return;
    }

    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
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
};

exports.create_account_of_account = function(account,password,callback){
    callback = callback == null? nop:callback;
    if(account == null || password == null || password == ''){
        callback(false,'账号或密码不能为空');
        return;
    }

    // var psw = crypto.md5(password);
    var sql = 'INSERT INTO t_accounts(account,password) VALUES("' + account + '","' + password + '")';
    console.log(sql)
    db.query(sql, function(err, rows, fields) {
        if (err) {
            if(err.code == 'ER_DUP_ENTRY'){
                callback(false);
                return;         
            }
            callback(false);
            throw err;
        }else{
            callback(true);            
        }
    });
};

exports.get_account_info_of_account = function(account,password,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }  
    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    console.log(sql)
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback({errcode:1,errmsg:'账号错误!'});
            throw err;
        }
        
        if(rows.length == 0){
            callback({errcode:1,errmsg:'账号错误!'});
            return;
        }
        if(password != null){
            // var psw = crypto.md5(password);
            var psw = password;
            if(rows[0].password == psw){
                callback(rows[0]);
            }else{
                callback({errcode:1,errmsg:'密码错误!'});
            }
            return; 
        }
        callback(rows[0]);
    }); 
};