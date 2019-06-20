local skynet = require "skynet"

local M = {}

local runconf = require(skynet.getenv("runconfig"))
local pinchidaoconf = runconf.pinchidaogame
local MAX_GLOBAL_COUNT = #pinchidaoconf.global


local function fetch_global(id)
    local index = id % MAX_GLOBAL_COUNT + 1
    return pinchidaoconf.global[index]
end

local function call(cmd, id, ...)
    local global = fetch_global(id)
	return skynet.call(global, "lua", cmd, id, ...)
end


function M.create(id)
	return call("pinchidao.create", id)
end

function M.enter(id, uid, data)
	return call("pinchidao.enter", id, uid, data)
end

function M.leave(id, uid)
	return call("pinchidao.leave", id, uid)
end

function M.get_forward(id)
	return fetch_global(id)
end


return M
