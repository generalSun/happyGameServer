var db = require('../../utils/db');

function nop(a,b,c,d,e,f,g){

}

exports.get_message_of_message = function(type,version,callback){
    callback = callback == null? nop:callback;
    
    var sql = 'SELECT * FROM t_message WHERE type = "'+ type + '"';
    
    if(version == "null"){
        version = null;
    }
    
    if(version){
        version = '"' + version + '"';
        sql += ' AND version != ' + version;   
    }
     
    db.query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            if(rows.length > 0){
                callback(rows[0]);    
            }
            else{
                callback(null);
            }
        }
    });
};