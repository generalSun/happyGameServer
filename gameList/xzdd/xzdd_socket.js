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

    //换牌
    socket.on('huanpai',function(data){
        if(socket.userId == null){
            return;
        }
        if(data == null){
            return;
        }

        if(typeof(data) == "string"){
            data = JSON.parse(data);
        }

        var p1 = data.p1;
        var p2 = data.p2;
        var p3 = data.p3;
        if(p1 == null || p2 == null || p3 == null){
            console.log("invalid data");
            return;
        }
        socket.gameMgr.huanSanZhang(socket.userId,p1,p2,p3);
    });

    //定缺
    socket.on('dingque',function(data){
        if(socket.userId == null){
            return;
        }
        var que = data;
        socket.gameMgr.dingQue(socket.userId,que);
    });

    //碰
    socket.on('peng',function(data){
        if(socket.userId == null){
            return;
        }
        socket.gameMgr.peng(socket.userId);
    });
    
    //杠
    socket.on('gang',function(data){
        if(socket.userId == null || data == null){
            return;
        }
        var pai = -1;
        if(typeof(data) == "number"){
            pai = data;
        }
        else if(typeof(data) == "string"){
            pai = parseInt(data);
        }
        else{
            console.log("gang:invalid param");
            return;
        }
        socket.gameMgr.gang(socket.userId,pai);
    });
    
    //胡
    socket.on('hu',function(data){
        if(socket.userId == null){
            return;
        }
        socket.gameMgr.hu(socket.userId);
    });
}