local env = require "faci.env"
local faci = require "faci.module"

local module = faci.get_module("room_api")
local dispatch = module.dispatch
local forward = module.forward


local ROOM 

function dispatch.start(msg)
    ROOM = require "room_ddz.room_ddz":new()
end 

function dispatch.enter(data)
    --TODO:判断超过人数上限
    if ROOM:is_player_num_overload() then
		ERROR("enter err player num overload")
        return false,DESK_ERROR.player_no_seat
    end 

	return ROOM:enter(data)
end

function dispatch.leave(uid)
	return ROOM:leave(uid)
end



--对接 agent 发过来的消息
function forward.move()
end 
