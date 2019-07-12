var tokenMgr = require('./../../game_server/tokenmgr');
var roomMgr = require('./../../game_server/roommgr');
var userMgr = require('./../../game_server/usermgr');

exports.listenMsg = function(socket){
    //出牌
    socket.on('chupai',function(data){
        if(socket.userId == null){
            return;
        }
        var pai = data;
        socket.gameMgr.chuPai(socket.userId,pai);
    });

    //过  遇上胡，碰，杠的时候，可以选择过
    socket.on('guo',function(data){
        if(socket.userId == null){
            return;
        }
        socket.gameMgr.guo(socket.userId);
    });

    //叫地主
    socket.on('jiaodizhu',function(data){
        if(socket.userId == null){
            return;
        }
        var pai = data;
        socket.gameMgr.chuPai(socket.userId,pai);
    });
}