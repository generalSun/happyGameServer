var roomMgr = require("../../game_server/roommgr");
var userMgr = require("../../game_server/usermgr");
var mjutils = require('../../utils/mjutils');
var db = require("../../utils/db");
var db_rooms = require('./../../dbList/rooms/db_rooms')
var db_games = require('./../../dbList/games/db_games')
var crypto = require("../../utils/crypto");
var constants = require('./../../game_server/config/constants')
var games = {};
var gamesIdBase = 0;

var ACTION_CHUPAI = 1;
var ACTION_MOPAI = 2;
var ACTION_PENG = 3;
var ACTION_GANG = 4;
var ACTION_HU = 5;
var ACTION_ZIMO = 6;

var gameSeatsOfUsers = {};

function getMJType(id){
    if(id >= 0 && id < 9){
        //筒
        return 0;
    }
    else if(id >= 9 && id < 18){
        //条
        return 1;
    }
    else if(id >= 18 && id < 27){
        //万
        return 2;
    }
}

//检查是否可以碰
function checkCanPeng(game,seatData,targetPai) {
    if(getMJType(targetPai) == seatData.que){
        return;
    }
    var count = seatData.countMap[targetPai];
    if(count != null && count >= 2){
        seatData.canPeng = true;
    }
}

//检查是否可以点杠
function checkCanDianGang(game,seatData,targetPai){
    //检查玩家手上的牌
    //如果没有牌了，则不能再杠
    if(game.pokers.length <= game.currentIndex){
        return;
    }
    if(getMJType(targetPai) == seatData.que){
        return;
    }
    var count = seatData.countMap[targetPai];
    if(count != null && count >= 3){
        seatData.canGang = true;
        seatData.gangPai.push(targetPai);
        return;
    }
}

//检查是否可以暗杠
function checkCanAnGang(game,seatData){
    //如果没有牌了，则不能再杠
    if(game.pokers.length <= game.currentIndex){
        return;
    }

    for(var key in seatData.countMap){
        var pai = parseInt(key);
        if(getMJType(pai) != seatData.que){
            var c = seatData.countMap[key];
            if(c != null && c == 4){
                seatData.canGang = true;
                seatData.gangPai.push(pai);
            }
        }
    }
}

//检查是否可以弯杠(自己摸起来的时候)
function checkCanWanGang(game,seatData){
    //如果没有牌了，则不能再杠
    if(game.pokers.length <= game.currentIndex){
        return;
    }

    //从碰过的牌中选
    for(var i = 0; i < seatData.pengs.length; ++i){
        var pai = seatData.pengs[i];
        if(seatData.countMap[pai] == 1){
            seatData.canGang = true;
            seatData.gangPai.push(pai);
        }
    }
}

function checkCanHu(game,seatData,targetPai) {
    game.lastHuPaiSeat = -1;
    if(getMJType(targetPai) == seatData.que){
        return;
    }
    seatData.canHu = false;
    for(var k in seatData.tingMap){
        if(targetPai == k){
            seatData.canHu = true;
        }
    }
}

function clearAllOptions(game,seatData){
    var fnClear = function(sd){
        sd.canPeng = false;
        sd.canGang = false;
        sd.gangPai = [];
        sd.canHu = false;
        sd.lastFangGangSeat = -1;    
    }
    if(seatData){
        fnClear(seatData);
    }
    else{
        game.qiangGangContext = null;
        for(var i = 0; i < game.gameSeats.length; ++i){
            fnClear(game.gameSeats[i]);
        }
    }
}

//检查听牌
function checkCanTingPai(game,seatData){
    seatData.tingMap = {};
    
    //检查手上的牌是不是已打缺，如果未打缺，则不进行判定
    for(var i = 0; i < seatData.holds.length; ++i){
        var pai = seatData.holds[i];
        if(getMJType(pai) == seatData.que){
            return;
        }   
    }

    //检查是否是七对 前提是没有碰，也没有杠 ，即手上拥有13张牌
    if(seatData.holds.length == 13){
        //有5对牌
        var hu = false;
        var danPai = -1;
        var pairCount = 0;
        for(var k in seatData.countMap){
            var c = seatData.countMap[k];
            if( c == 2 || c == 3){
                pairCount++;
            }
            else if(c == 4){
                pairCount += 2;
            }

            if(c == 1 || c == 3){
                //如果已经有单牌了，表示不止一张单牌，并没有下叫。直接闪
                if(danPai >= 0){
                    break;
                }
                danPai = k;
            }
        }

        //检查是否有6对 并且单牌是不是目标牌
        if(pairCount == 6){
            //七对只能和一张，就是手上那张单牌
            //七对的番数＝ 2番+N个4个牌（即龙七对）
            seatData.tingMap[danPai] = {
                fan:2,
                pattern:"7pairs"
            };
            //如果是，则直接返回咯
        }
    }

    //检查是否是对对胡  由于四川麻将没有吃，所以只需要检查手上的牌
    //对对胡叫牌有两种情况
    //1、N坎 + 1张单牌
    //2、N-1坎 + 两对牌
    var singleCount = 0;
    var colCount = 0;
    var pairCount = 0;
    var arr = [];
    for(var k in seatData.countMap){
        var c = seatData.countMap[k];
        if(c == 1){
            singleCount++;
            arr.push(k);
        }
        else if(c == 2){
            pairCount++;
            arr.push(k);
        }
        else if(c == 3){
            colCount++;
        }
        else if(c == 4){
            //手上有4个一样的牌，在四川麻将中是和不了对对胡的 随便加点东西
            singleCount++;
            pairCount+=2;
        }
    }

    if((pairCount == 2 && singleCount == 0) || (pairCount == 0 && singleCount == 1) ){
        for(var i = 0; i < arr.length; ++ i){
            //对对胡1番
            var p = arr[i];
            if(seatData.tingMap[p] == null){
                seatData.tingMap[p] = {
                    pattern:"duidui",
                    fan:1
                };
            }
        }
    }

    //console.log(seatData.holds);
    //console.log(seatData.countMap);
    //console.log("singleCount:" + singleCount + ",colCount:" + colCount + ",pairCount:" + pairCount);
    //检查是不是平胡
    if(seatData.que != 0){
        mjutils.checkTingPai(seatData,0,9);        
    }

    if(seatData.que != 1){
        mjutils.checkTingPai(seatData,9,18);        
    }

    if(seatData.que != 2){
        mjutils.checkTingPai(seatData,18,27);        
    }
}

function getSeatIndex(userId){
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null){
        return null;
    }
    return seatIndex;
}

function getGameByUserID(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null){
        return null;
    }
    var game = games[roomId];
    return game;
}

function moveToNextUser(game,nextSeat){
    game.fangpaoshumu = 0;
    //找到下一个没有和牌的玩家
    if(nextSeat == null){
        while(true){
            game.turn ++;
            game.turn %= 4;
            var turnSeat = game.gameSeats[game.turn];
            if(turnSeat.hued == false){
                return;
            }
        }
    }
    else{
        game.turn = nextSeat;
    }
}

function doUserMoPai(game){
    game.chuPai = -1;
    var turnSeat = game.gameSeats[game.turn];
    turnSeat.lastFangGangSeat = -1;
    turnSeat.guoHuFan = -1;
    var pai = mopai(game,game.turn);
    //牌摸完了，结束
    if(pai == -1){
        doGameOver(game,turnSeat.userId);
        return;
    }
    else{
        var numOfMJ = game.pokers.length - game.currentIndex;
        userMgr.broacastInRoom('mj_count_push',numOfMJ,turnSeat.userId,true);
    }

    recordGameAction(game,game.turn,ACTION_MOPAI,pai);

    //通知前端新摸的牌
    userMgr.sendMsg(turnSeat.userId,'game_mopai_push',pai);
    //检查是否可以暗杠或者胡
    //检查胡，直杠，弯杠
    checkCanAnGang(game,turnSeat);
    checkCanWanGang(game,turnSeat,pai);

    //检查看是否可以和
    checkCanHu(game,turnSeat,pai);

    //广播通知玩家出牌方
    turnSeat.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push',turnSeat.userId,turnSeat.userId,true);

    //通知玩家做对应操作
    sendOperations(game,turnSeat,game.chuPai);
}

function isSameType(type,arr){
    for(var i = 0; i < arr.length; ++i){
        var t = getMJType(arr[i]);
        if(type != -1 && type != t){
            return false;
        }
        type = t;
    }
    return true; 
}

function isQingYiSe(gameSeatData){
    var type = getMJType(gameSeatData.holds[0]);

    //检查手上的牌
    if(isSameType(type,gameSeatData.holds) == false){
        return false;
    }

    //检查杠下的牌
    if(isSameType(type,gameSeatData.angangs) == false){
        return false;
    }
    if(isSameType(type,gameSeatData.wangangs) == false){
        return false;
    }
    if(isSameType(type,gameSeatData.diangangs) == false){
        return false;
    }

    //检查碰牌
    if(isSameType(type,gameSeatData.pengs) == false){
        return false;
    }
    return true;
}

function isMenQing(gameSeatData){
    return (gameSeatData.pengs.length + gameSeatData.wangangs.length + gameSeatData.diangangs.length) == 0;
}

function isZhongZhang(gameSeatData){
    var fn = function(arr){
        for(var i = 0; i < arr.length; ++i){
            var pai = arr[i];
            if(pai == 0 || pai == 8 || pai == 9 || pai == 17 || pai == 18 || pai == 26){
                return false;
            }
        }
        return true;
    }
    
    if(fn(gameSeatData.pengs) == false){
        return false;
    }
    if(fn(gameSeatData.angangs) == false){
        return false;
    }
    if(fn(gameSeatData.diangangs) == false){
        return false;
    }
    if(fn(gameSeatData.wangangs) == false){
        return false;
    }
    if(fn(gameSeatData.holds) == false){
        return false;
    }
    return true;
}

function isJiangDui(gameSeatData){
    var fn = function(arr){
        for(var i = 0; i < arr.length; ++i){
            var pai = arr[i];
            if(pai != 1 && pai != 4 && pai != 7
               && pai != 9 && pai != 13 && pai != 16
               && pai != 18 && pai != 21 && pai != 25
               ){
                return false;
            }
        }
        return true;
    }
    
    if(fn(gameSeatData.pengs) == false){
        return false;
    }
    if(fn(gameSeatData.angangs) == false){
        return false;
    }
    if(fn(gameSeatData.diangangs) == false){
        return false;
    }
    if(fn(gameSeatData.wangangs) == false){
        return false;
    }
    if(fn(gameSeatData.holds) == false){
        return false;
    }
    return true;
}

function isTinged(seatData){
    for(var k in seatData.tingMap){
        return true;
    }
    return false;
}

function computeFanScore(game,fan){
    if(fan > game.conf.maxFan){
        fan = game.conf.maxFan;
    }
    return (1 << fan) * game.conf.baseScore;
}

//是否需要查大叫(有两家以上未胡，且有人没有下叫)
function needChaDaJiao(game){
    //查叫
    var numOfHued = 0;
    var numOfTinged = 0;
    var numOfUntinged = 0;
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ts = game.gameSeats[i];
        if(ts.hued){
            numOfHued ++;
            numOfTinged++;
        }
        else if(isTinged(ts)){
            numOfTinged++;
        }
        else{
            numOfUntinged++;
        }
    }
   
    //如果三家都胡牌了，不需要查叫
    if(numOfHued == 3){
        return false;
    }
    
    //如果没有任何一个人叫牌，也没有任何一个胡牌，则不需要查叫
    if(numOfTinged == 0){
        return false;
    }
    
    //如果都听牌了，也不需要查叫
    if(numOfUntinged == 0){
        return false;
    }
    return true;
}

function findMaxFanTingPai(ts){
    //找出最大番
    var cur = null;
    for(var k in ts.tingMap){
        var tpai = ts.tingMap[k];
        if(cur == null || tpai.fan > cur.fan){
            cur = tpai;
        }
    }
    return cur;
}

function findUnTingedPlayers(game){
    var arr = [];
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ts = game.gameSeats[i];
        //如果没有胡，且没有听牌
        if(!ts.hued && !isTinged(ts)){
            arr.push(i);
            recordUserAction(game,ts,"beichadajiao",-1);
        }
    }
    return arr;
}

function chaJiao(game){
    var arr = findUnTingedPlayers(game);
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ts = game.gameSeats[i];
        //如果没有胡，但是听牌了，则未叫牌的人要给钱
        if(!ts.hued && isTinged(ts)){
            var cur = findMaxFanTingPai(ts);
            ts.fan = cur.fan;
            ts.pattern = cur.pattern;
            recordUserAction(game,ts,"chadajiao",arr);
        }
    }
}

function calculateResult(game,roomInfo){
    
    var isNeedChaDaJia = needChaDaJiao(game);
    if(isNeedChaDaJia){
        chaJiao(game);
    }
    
    var baseScore = game.conf.baseScore;
    var numOfHued = 0;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].hued == true){
            numOfHued++;
        }
    }
    
    for(var i = 0; i < game.gameSeats.length; ++i){
        var sd = game.gameSeats[i];
        
        //统计杠的数目
        sd.numAnGang = sd.angangs.length;
        sd.numMingGang = sd.wangangs.length + sd.diangangs.length;
        
        //对所有胡牌的玩家进行统计
        if(isTinged(sd)){
            //统计自己的番子和分数
            //基础番(平胡0番，对对胡1番、七对2番) + 清一色2番 + 杠+1番
            //杠上花+1番，杠上炮+1番 抢杠胡+1番，金钩胡+1番，海底胡+1番
            var fan = sd.fan;
            if(isQingYiSe(sd)){
                sd.qingyise = true;
                fan += 2;
            }
            
            var numOfGangs = sd.diangangs.length + sd.wangangs.length + sd.angangs.length;
            for(var j = 0; j < sd.pengs.length; ++j){
                var pai = sd.pengs[j];
                if(sd.countMap[pai] == 1){
                    numOfGangs++;
                }
            }
            for(var k in sd.countMap){
                if(sd.countMap[k] == 4){
                    numOfGangs++;
                }
            }
            sd.numofgen = numOfGangs;
            
            //金钩胡
            if(sd.holds.length == 1 || sd.holds.length == 2){
                fan += 1;
                sd.isJinGouHu = true;
            }
            
            if(sd.isHaiDiHu){
                fan += 1;
            }
            
            if(game.conf.tiandihu){
                if(sd.isTianHu){
                    fan += 3;
                }
                else if(sd.isDiHu){
                    fan += 2;
                }
            }
            
            var isjiangdui = false;
            if(game.conf.jiangdui){
                if(sd.pattern == "7pairs"){
                    if(sd.numofgen > 0){
                        sd.numofgen -= 1;
                        sd.pattern == "l7pairs";
                        isjiangdui = isJiangDui(sd);
                        if(isjiangdui){
                            sd.pattern == "j7paris";
                            fan += 2;    
                        }   
                        else{
                            fan += 1;
                        }
                    }
                }
                else if(sd.pattern == "duidui"){
                    isjiangdui = isJiangDui(sd);
                    if(isjiangdui){
                        sd.pattern = "jiangdui";
                        fan += 2;   
                    }
                }   
            }
            
            if(game.conf.menqing){
                //不是将对，才检查中张
                if(!isjiangdui){
                    sd.isZhongZhang = isZhongZhang(sd);
                    if(sd.isZhongZhang){
                        fan += 1;
                    }                
                }
                
                sd.isMenQing = isMenQing(sd);
                if(sd.isMenQing){
                    fan += 1;
                }                
            }
            
            fan += sd.numofgen;
            if(sd.isGangHu){
                fan += 1;
            }
            if(sd.isQiangGangHu){
                fan += 1;
            }

            //收杠钱
            var additonalscore = 0;
            for(var a = 0; a < sd.actions.length; ++a){
                var ac = sd.actions[a];
                if(ac.type == "fanggang"){
                    var ts = game.gameSeats[ac.targets[0]];
                    //检查放杠的情况，如果目标没有和牌，且没有叫牌，则不算 用于优化前端显示
                    if(isNeedChaDaJia && (ts.hued) == false && (isTinged(ts) == false)){
                        ac.state = "nop";
                    }
                }
                else if(ac.type == "angang" || ac.type == "wangang" || ac.type == "diangang"){
                    if(ac.state != "nop"){
                        var acscore = ac.score;
                        additonalscore += ac.targets.length * acscore * baseScore;
                        //扣掉目标方的分
                        for(var t = 0; t < ac.targets.length; ++t){
                            var six = ac.targets[t];
                            game.gameSeats[six].score -= acscore * baseScore;
                        }                   
                    }
                }
                else if(ac.type == "maozhuanyu"){
                    //对于呼叫转移，如果对方没有叫牌，表示不得行
                    if(isTinged(ac.owner)){
                        //如果
                        var ref = ac.ref;
                        var acscore = ref.score;
                        var total = ref.targets.length * acscore * baseScore;
                        additonalscore += total;
                        //扣掉目标方的分
                        if(ref.payTimes == 0){
                            for(var t = 0; t < ref.targets.length; ++t){
                                var six = ref.targets[t];
                                game.gameSeats[six].score -= acscore * baseScore;
                            }                            
                        }
                        else{
                            //如果已经被扣过一次了，则由杠牌这家赔
                            ac.owner.score -= total;
                        }
                        ref.payTimes++;
                        ac.owner = null;
                        ac.ref = null;
                    }
                }
                else if(ac.type == "zimo" || ac.type == "hu" || ac.type == "ganghua" || ac.type == "dianganghua" || ac.type == "gangpaohu" || ac.type == "qiangganghu" || ac.type == "chadajiao"){
                    var extraScore = 0;
                    if(ac.iszimo){
                        if(game.conf.zimo == 0){
                            //自摸加底
                            extraScore = baseScore;
                        }
                        if(game.conf.zimo == 1){
                            fan += 1;
                        }
                        else{
                            //nothing.
                        }
                        sd.numZiMo ++;
                    }
                    else{
                        if(ac.type != "chadajiao"){
                            sd.numJiePao ++;
                        }
                    }
                    
                    var score = computeFanScore(game,fan) + extraScore;
                    sd.score += score * ac.targets.length;

                    for(var t = 0; t < ac.targets.length; ++t){
                        var six = ac.targets[t];
                        var td = game.gameSeats[six]; 
                        td.score -= score;
                        if(td != sd){
                            if(ac.type == "chadajiao"){
                                td.numChaJiao ++;
                            }
                            else if(!ac.iszimo){
                                td.numDianPao ++;
                            }                            
                        }
                    }
                }
            }

            if(fan > game.conf.maxFan){
                fan = game.conf.maxFan;
            }
            //一定要用 += 。 因为此时的sd.score可能是负的
            sd.score += additonalscore;
            if(sd.pattern != null){
                sd.fan = fan;
            }
        }
        else{
            for(var a = sd.actions.length -1; a >= 0; --a){
                var ac = sd.actions[a];
                if(ac.type == "angang" || ac.type == "wangang" || ac.type == "diangang"){
                    //如果3家都胡牌，则需要结算。否则认为是查叫
                    if(numOfHued < 3){
                        sd.actions.splice(a,1);                        
                    }
                    else{
                        if(ac.state != "nop"){
                            var acscore = ac.score;
                            sd.score += ac.targets.length * acscore * baseScore;
                            //扣掉目标方的分
                            for(var t = 0; t < ac.targets.length; ++t){
                                var six = ac.targets[t];
                                game.gameSeats[six].score -= acscore * baseScore;
                            }                   
                        }   
                    }
                }
            }
        }
    }
}

function doGameOver(game,userId,forceEnd){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    var results = [];
    var dbresult = [0,0,0,0];
    
    var fnNoticeResult = function(isEnd){
        var endinfo = null;
        if(isEnd){
            endinfo = [];
            for(var i = 0; i < roomInfo.seats.length; ++i){
                var rs = roomInfo.seats[i];
                endinfo.push({
                    numzimo:rs.numZiMo,
                    numjiepao:rs.numJiePao,
                    numdianpao:rs.numDianPao,
                    numangang:rs.numAnGang,
                    numminggang:rs.numMingGang,
                    numchadajiao:rs.numChaJiao, 
                });
            }   
        }
        userMgr.broacastInRoom('game_over_push',{results:results,endinfo:endinfo},userId,true);
        //如果局数已够，则进行整体结算，并关闭房间
        if(isEnd){
            setTimeout(function(){
                if(roomInfo.num_of_turns > 1){
                    store_history(roomInfo);    
                }
                
                userMgr.kickAllInRoom(roomId);
                roomMgr.destroy(roomId);
                db.archive_games(roomInfo.uuid);            
            },1500);
        }
    }

    if(game != null){
        if(!forceEnd){
            calculateResult(game,roomInfo);    
        }
       
        for(var i = 0; i < roomInfo.seats.length; ++i){
            var rs = roomInfo.seats[i];
            var sd = game.gameSeats[i];

            rs.ready = false;
            rs.score += sd.score;
            rs.numZiMo += sd.numZiMo;
            rs.numJiePao += sd.numJiePao;
            rs.numDianPao += sd.numDianPao;
            rs.numAnGang += sd.numAnGang;
            rs.numMingGang += sd.numMingGang;
            rs.numChaJiao += sd.numChaJiao;
            
            var userRT = {
                userId:sd.userId,
                pengs:sd.pengs,
                actions:[],
                wangangs:sd.wangangs,
                diangangs:sd.diangangs,
                angangs:sd.angangs,
                numofgen:sd.numofgen,
                holds:sd.holds,
                fan:sd.fan,
                score:sd.score,
                totalscore:rs.score,
                qingyise:sd.qingyise,
                pattern:sd.pattern,
                isganghu:sd.isGangHu,
                menqing:sd.isMenQing,
                zhongzhang:sd.isZhongZhang,
                jingouhu:sd.isJinGouHu,
                haidihu:sd.isHaiDiHu,
                tianhu:sd.isTianHu,
                dihu:sd.isDiHu,
                huorder:game.hupaiList.indexOf(i),
            };
            
            for(var k in sd.actions){
                userRT.actions[k] = {
                    type:sd.actions[k].type,
                };
            }
            results.push(userRT);


            dbresult[i] = sd.score;
            delete gameSeatsOfUsers[sd.userId];
        }
        delete games[roomId];
        
        var old = roomInfo.currentPlayingIndex;
        if(game.yipaoduoxiang >= 0){
            roomInfo.currentPlayingIndex = game.yipaoduoxiang;
        }
        else if(game.firstHupai >= 0){
            roomInfo.currentPlayingIndex = game.firstHupai;
        }
        else{
            roomInfo.currentPlayingIndex = (game.turn + 1) % 4;
        }

        if(old != roomInfo.currentPlayingIndex){
            db.update_currentPlayingIndex_of_games(roomId,roomInfo.currentPlayingIndex);
        }
    }
    
    if(forceEnd || game == null){
        fnNoticeResult(true);   
    }
    else{
        //保存游戏
        store_game(game,function(ret){
            
            db.update_game_result_of_games(roomInfo.uuid,dbresult);
            
            //记录打牌信息
            var str = JSON.stringify(game.actionList);
            db.update_game_action_records_of_games(roomInfo.uuid,str);
        
            //保存游戏局数
            db.update_num_of_turns_of_rooms(roomId,roomInfo.num_of_turns);
            
            //如果是第一次，并且不是强制解散 则扣除房卡
            if(roomInfo.num_of_turns == 1){
                var cost = 2;
                if(roomInfo.conf.maxGames == 8){
                    cost = 3;
                }
                db.cost_gems(game.gameSeats[0].userId,cost);
            }

            var isEnd = (roomInfo.num_of_turns >= roomInfo.conf.maxGames);
            fnNoticeResult(isEnd);
        });   
    }
}

function recordUserAction(game,seatData,type,target){
    var d = {type:type,targets:[]};
    if(target != null){
        if(typeof(target) == 'number'){
            d.targets.push(target);    
        }
        else{
            d.targets = target;
        }
    }
    else{
        for(var i = 0; i < game.gameSeats.length; ++i){
            var s = game.gameSeats[i];
            if(i != seatData.seatIndex && s.hued == false){
                d.targets.push(i);
            }
        }        
    }

    seatData.actions.push(d);
    return d;
}

function recordGameAction(game,si,action,pai){
    game.actionList.push(si);
    game.actionList.push(action);
    if(pai != null){
        game.actionList.push(pai);
    }
}

function store_single_history(userId,history){
    db.get_user_history_of_users(userId,function(data){
        if(data == null){
            data = [];
        }
        while(data.length >= 10){
            data.shift();
        }
        data.push(history);
        db.update_user_history(userId,data);
    });
}

function store_history(roomInfo){
    var seats = roomInfo.seats;
    var history = {
        uuid:roomInfo.uuid,
        id:roomInfo.id,
        time:roomInfo.createTime,
        seats:new Array(4)
    };

    for(var i = 0; i < seats.length; ++i){
        var rs = seats[i];
        var hs = history.seats[i] = {};
        hs.userId = rs.userId;
        hs.name = crypto.toBase64(rs.name);
        hs.score = rs.score;
    }

    for(var i = 0; i < seats.length; ++i){
        var s = seats[i];
        store_single_history(s.userId,history);
    }
}

function construct_game_base_info(game){
    var baseInfo = {
        type:game.conf.type,
        button:game.button,
        index:game.num_of_turns,
        pokers:game.pokers,
        game_seats:new Array(4)
    }
    
    for(var i = 0; i < 4; ++i){
        baseInfo.game_seats[i] = game.gameSeats[i].holds;
    }
    game.baseInfoJson = JSON.stringify(baseInfo);
}

function store_game(game,callback){
    db.create_game_of_games(game.roomInfo.uuid,game.baseInfoJson,callback);
}
/**
 -----------------------------------------------------------------------------------
 */
exports.guo = function(userId){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }

    var seatIndex = seatData.seatIndex;
    var game = seatData.game;

    //如果玩家没有对应的操作，则也认为是非法消息
    if((seatData.canGang || seatData.canPeng || seatData.canHu) == false){
        console.log("no need guo.");
        return;
    }

    //如果是玩家自己的轮子，不是接牌，则不需要额外操作
    var doNothing = game.chuPai == -1 && game.turn == seatIndex;

    userMgr.sendMsg(seatData.userId,"guo_result");
    clearAllOptions(game,seatData);
    
    //这里还要处理过胡的情况
    if(game.chuPai >= 0 && seatData.canHu){
        seatData.guoHuFan = seatData.tingMap[game.chuPai].fan;
    }

    if(doNothing){
        return;
    }
    
    //如果还有人可以操作，则等待
    for(var i = 0; i < game.gameSeats.length; ++i){
        var ddd = game.gameSeats[i];
        if(hasOperations(ddd)){
            return;
        }
    }

    //如果是已打出的牌，则需要通知。
    if(game.chuPai >= 0){
        var uid = game.gameSeats[game.turn].userId;
        userMgr.broacastInRoom('guo_notify_push',{userId:uid,pai:game.chuPai},seatData.userId,true);
        seatData.folds.push(game.chuPai);
        game.chuPai = -1;
    }
    
    
    var qiangGangContext = game.qiangGangContext;
    //清除所有的操作
    clearAllOptions(game);
    
    if(qiangGangContext != null && qiangGangContext.isValid){
        doGang(game,qiangGangContext.turnSeat,qiangGangContext.seatData,"wangang",1,qiangGangContext.pai);        
    }else{
        //下家摸牌
        moveToNextUser(game);
        doUserMoPai(game);   
    }
};

exports.chuPai = function(userId,pai){

    pai = Number.parseInt(pai);
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        console.log("can't find user game data.");
        return;
    }

    var game = seatData.game;
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if(game.turn != seatData.seatIndex){
        console.log("not your turn.");
        return;
    }

    if(seatData.hued){
        console.log('you have already hued. no kidding plz.');
        return;
    }

    if(seatData.canChuPai == false){
        console.log('no need chupai.');
        return;
    }

    if(hasOperations(seatData)){
        console.log('plz guo before you chupai.');
        return;
    }

    //从此人牌中扣除
    var index = seatData.holds.indexOf(pai);
    if(index == -1){
        console.log("holds:" + seatData.holds);
        console.log("can't find mj." + pai);
        return;
    }
    
    seatData.canChuPai = false;
    game.chupaiCnt ++;
    seatData.guoHuFan = -1;
    
    seatData.holds.splice(index,1);
    seatData.countMap[pai] --;
    game.chuPai = pai;
    recordGameAction(game,seatData.seatIndex,ACTION_CHUPAI,pai);
    checkCanTingPai(game,seatData);
   
    userMgr.broacastInRoom('game_chupai_notify_push',{userId:seatData.userId,pai:pai},seatData.userId,true);

    //如果出的牌可以胡，则算过胡
    if(seatData.tingMap[game.chuPai]){
        seatData.guoHuFan = seatData.tingMap[game.chuPai].fan;
    }
    
    //检查是否有人要胡，要碰 要杠
    var hasActions = false;
    for(var i = 0; i < game.gameSeats.length; ++i){
        //玩家自己不检查
        if(game.turn == i){
            continue;
        }
        var ddd = game.gameSeats[i];
        //已经和牌的不再检查
        if(ddd.hued){
            continue;
        }

        checkCanHu(game,ddd,pai);
        if(seatData.lastFangGangSeat == -1){
            if(ddd.canHu && ddd.guoHuFan >= 0 && ddd.tingMap[pai].fan <= ddd.guoHuFan){
                console.log("ddd.guoHuFan:" + ddd.guoHuFan);
                ddd.canHu = false;
                userMgr.sendMsg(ddd.userId,'guohu_push');            
            }     
        }
        checkCanPeng(game,ddd,pai);
        checkCanDianGang(game,ddd,pai);
        if(hasOperations(ddd)){
            sendOperations(game,ddd,game.chuPai);
            hasActions = true;    
        }
    }
    
    //如果没有人有操作，则向下一家发牌，并通知他出牌
    if(!hasActions){
        setTimeout(function(){
            userMgr.broacastInRoom('guo_notify_push',{userId:seatData.userId,pai:game.chuPai},seatData.userId,true);
            seatData.folds.push(game.chuPai);
            game.chuPai = -1;
            moveToNextUser(game);
            doUserMoPai(game);
        },500);
    }
};

function sendOperations(game,seatData) {
    var data = {
        currentPlayingIndex:game.currentPlayingIndex,
    };
    //如果可以有操作，则进行操作
    userMgr.sendMsg(seatData.userId,'game_action_push',data);
}

function shuffle(playerMaxNum) {
    var pokers = [];
    if(playerMaxNum == 3){
        pokers = [
            0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,//黑桃
            0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1a,0x1b,0x1c,0x1d,//梅花
            0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,//红桃
            0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,//方块
            0x041,0x042
        ]
    }else if(playerMaxNum == 4){
        pokers = [
            0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,//黑桃
            0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1a,0x1b,0x1c,0x1d,//梅花
            0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,//红桃
            0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,//方块
            0x041,0x042,

            0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,0x0c,0x0d,//黑桃
            0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1a,0x1b,0x1c,0x1d,//梅花
            0x21,0x22,0x23,0x24,0x25,0x26,0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,//红桃
            0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,0x3d,//方块
            0x041,0x042
        ]
    }
    

    for(var i = 0; i < pokers.length; ++i){
        var lastIndex = pokers.length - 1 - i;
        var index = Math.floor(Math.random() * lastIndex);
        var t = pokers[index];
        pokers[index] = pokers[lastIndex];
        pokers[lastIndex] = t;
    }
    return pokers
}

function mopai(game,seatIndex) {
    if(game.currentPokersIndex == game.pokers.length){
        return -1;
    }
    
    var pai = game.pokers[game.currentPokersIndex];
    game.gameSeats[seatIndex].holds.push(pai);
    game.gameSeats[seatIndex].holdsNum ++;
    game.currentPokersIndex ++;
    return pai;
}

function deal(game,playerMaxNum){
    //强制清0
    game.currentPokersIndex = 0;
    var pokers = game.pokers;
    var perPlayerPokerNum = 17
    if(playerMaxNum == 3){
        perPlayerPokerNum = 17
    }else if(playerMaxNum == 4){
        perPlayerPokerNum = 27
    }
    var seatIndex = game.currentPlayingIndex;
    for(var i = 0; i < perPlayerPokerNum*playerMaxNum; ++i){
        var holds = game.gameSeats[seatIndex].holds;
        if(holds == null || holds.length == 0){
            game.gameSeats[seatIndex].holds = [];
            game.gameSeats[seatIndex].holdsNum = 0;
        }
        mopai(game,seatIndex);
        seatIndex ++;
        seatIndex %= playerMaxNum;
    }
    game.yuCards = []
    for(var i = game.currentPokersIndex; i < pokers.length; i++){
        var poker = pokers[i]
        game.yuCards.push(poker);
    }
}

exports.setReady = function(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }
    roomMgr.setReady(userId,true);
}

//尝试重新一局
exports.enterRoomAgain = function(userId,roomInfo,info) {
    var game = games[roomInfo.roomId]
    if(!game){
        game = exports.createGame(roomInfo.roomId)
        games[roomInfo.roomId] = game;
        //洗牌
        game.pokers = shuffle(roomInfo.conf.playerMaxNum);
        //发牌
        deal(game,roomInfo.conf.playerMaxNum);
    }
    var playerMaxNum = roomInfo.conf.playerMaxNum
    var data = {
        state:game.state,
        isNewTurn:game.isNewTurn,
        num_of_turns:roomInfo.num_of_turns,
        yuCards:game.yuCards,
        currentPlayingIndex:info.currentPlayingIndex,
    };

    data.seatsInfo = [];
    var seatData = null;
    for(var i = 0; i < playerMaxNum; ++i){
        var sd = game.gameSeats[i];

        var s = {
            userId:sd.userId,
            folds:sd.folds,
        }
        if(sd.userId == userId){
            s.holds = sd.holds;
            seatData = sd;
        }else{
            s.holdsNum = sd.holdsNum
        }
        data.seatsInfo.push(s);
    }

    //同步整个信息给客户端
    userMgr.sendMsg(userId,'game_sync_push',data);
    sendOperations(game,seatData);
}

//创建房间
exports.createGame = function(roomId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if(!roomInfo){
        return null
    }
    var seats = roomInfo.seats;
    var game = {
        start_time:Math.ceil(Date.now()/1000),
        roomId:roomInfo.roomId,
        currentPlayingIndex:0,//指向当前操作玩家
        pokers:new Array(),//游戏所有扑克牌
        currentPokersIndex:0,//指向当前摸牌时pokers的位置
        gameSeats:new Array(roomInfo.conf.playerMaxNum),//游戏所有玩家
        yuCards:new Array(),//剩余的扑克
        isNewTurn:true,//是否是新的一轮
        state:constants.ROOM_state.idel,//游戏状态
        actionList:[],//记录玩家操作信息，用于战绩回放
    };
    for(var i = 0; i < roomInfo.conf.playerMaxNum; ++i){
        var data = game.gameSeats[i] = {};

        data.seatIndex = i;

        data.userId = seats[i].userId;

        //持有的牌
        data.holds = [];

        //打出的牌
        data.folds = [];

        //手牌数量
        data.holdsNum = 0;

        data.actions = [];

        data.score = 0;

        gameSeatsOfUsers[data.userId] = data;
    }
    return game
};

//开始新的一局
exports.begin = function(userId,roomId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    db_games.is_game_exist_of_games(roomId,function(ret,info){
        if(ret){
            exports.enterRoomAgain(userId,roomId,info)
        }else{
            var game = exports.createGame(roomId)
            if(!game){
                return
            }
            games[roomId] = game;
            //洗牌
            game.pokers = shuffle(roomInfo.conf.playerMaxNum);
            //发牌
            deal(game,roomInfo.conf.playerMaxNum);
            db_games.create_game_of_games(roomId,game.start_time,game.currentPlayingIndex)
            roomInfo.num_of_turns++;
            db_rooms.update_num_of_turns_of_rooms(roomId,roomInfo.num_of_turns)
            for(var i = 0; i < game.gameSeats.length; ++i){
                //开局时，通知前端必要的数据
                var s = game.gameSeats[i];
                var msg = {
                    num_of_turns:roomInfo.num_of_turns,
                    yuCards:game.yuCards,
                    currentPlayingIndex:game.currentPlayingIndex,
                    seatsInfo:new Array()
                }
                for(var j = 0; j < game.gameSeats.length; ++j){
                    var seat = game.gameSeats[j]
                    var args = {
                        userId:seat.userId
                    }
                    if(seat.userId == s.userId){
                        args.holds = game.gameSeats[j].holds
                    }else{
                        args.holdsNum = game.gameSeats[j].holdsNum
                    }
                    msg.seatsInfo.push(args)
                }
                //通知游戏开始
                userMgr.sendMsg(s.userId,'game_begin_push',msg);
            }
        }
    })
};

exports.isPlaying = function(userId){
    var seatData = gameSeatsOfUsers[userId];
    if(seatData == null){
        return false;
    }

    var game = seatData.game;

    if(game.state == "idle"){
        return false;
    }
    return true;
}

exports.hasBegan = function(roomId){
    var game = games[roomId];
    if(game != null){
        return true;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo != null){
        return roomInfo.num_of_turns > 0;
    }
    return false;
};
/**
 -----------------------------------------------------------------------------------
 */

var dissolvingList = [];

exports.doDissolve = function(roomId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return null;
    }

    var game = games[roomId];
    doGameOver(game,roomInfo.seats[0].userId,true);
};

exports.dissolveRequest = function(roomId,userId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return null;
    }

    if(roomInfo.dr != null){
        return null;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null){
        return null;
    }

    roomInfo.dr = {}
    roomInfo.dr.endTime = Date.now() + 30000
    roomInfo.dr.originator = userId
    roomInfo.dr.states = []
    for(var i = 0; i < roomInfo.conf.playerMaxNum; i++){
        roomInfo.dr.states[i] = 0
    }
    roomInfo.dr.states[seatIndex] = 1;

    dissolvingList.push(roomId);

    return roomInfo;
};

exports.dissolveAgree = function(roomId,userId,agree){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return null;
    }

    if(roomInfo.dr == null){
        return null;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null){
        return null;
    }

    if(agree){
        roomInfo.dr.states[seatIndex] = 1;
    }else{
        roomInfo.dr = null;
        var idx = dissolvingList.indexOf(roomId);
        if(idx != -1){
            dissolvingList.splice(idx,1);           
        }
    }
    return roomInfo;
};

function update() {
    for(var i = dissolvingList.length - 1; i >= 0; --i){
        var roomId = dissolvingList[i];
        
        var roomInfo = roomMgr.getRoom(roomId);
        if(roomInfo != null && roomInfo.dr != null){
            if(Date.now() > roomInfo.dr.endTime){
                console.log("delete room and games");
                exports.doDissolve(roomId);
                dissolvingList.splice(i,1); 
            }
        }else{
            dissolvingList.splice(i,1);
        }
    }
}

setInterval(update,1000);