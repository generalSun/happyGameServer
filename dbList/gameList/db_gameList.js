var db = require('../../utils/db');

function nop(a,b,c,d,e,f,g){

}

exports.get_gameList_of_gameList = function(callback){
    callback = callback == null? nop:callback;

    var sql = 'SELECT * FROM t_gameList';
    db.query(sql, function(err, rows, fields) {
        if(err){
            callback(null);
            throw err;
        }
        if(rows.length > 0){
            callback(rows);
        }
        else{
            callback(null);
        }
    });
};