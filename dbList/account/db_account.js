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
    if(account == null || password == null){
        callback(false);
        return;
    }

    // var psw = crypto.md5(password);
    var sql = 'INSERT INTO t_accounts(account,password) VALUES("' + account + '","' + password + '")';
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
    db.query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        
        if(rows.length == 0){
            callback(null);
            return;
        }
        
        if(password != null){
            // var psw = crypto.md5(password);
            var psw = password;
            if(rows[0].password == psw){
                callback(rows[0]);
                return;
            }  
            callback(null);  
        }
        callback(rows[0]);
    }); 
};