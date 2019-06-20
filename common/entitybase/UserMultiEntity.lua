local skynet = require "skynet"
local UserEntity = require "UserEntity"

-- UserMultiEntity
local UserMultiEntity = class("UserMultiEntity", UserEntity)

-- self.recordset格式如下：
--[[
{
    [uid1] = 
    {
        [id1] = { field1 = 1, field2 = 2 }
        [id2] = { field1 = 1, field2 = 2 }
    },
    [uid2] = 
    {
        [id1] = { field1 = 1, field2 = 2 }
        [id2] = { field1 = 1, field2 = 2 }
    },
}
--]]


function UserMultiEntity:ctor()
    UserMultiEntity.super.ctor(self)
    self.ismulti = true     -- 是否多行记录
end

-- 加载玩家数据
function UserMultiEntity:load(uid)

    if not self.recordset[uid] then
        local rs = skynet.call("dbmgr", "lua", "get_user_multi", self.tbname, uid)
        if rs then
            self.recordset[uid] = rs
        end
    end
end

-- 将内存中的数据先同步回redis,再从redis加载到内存（该方法要不要待定）
function UserMultiEntity:reload(uid)

end

-- 卸载玩家数据
function UserMultiEntity:unload(uid)
    local rs = self.recordset[uid]
    if rs then
        for k, v in pairs(rs) do
            rs[k] = nil
        end

        self.recordset[uid] = nil

        -- 是否需要移除待定
        -- 从redis删除，但不删除mysql中的数据
    end
end

-- record,record,v形式table
-- 内存中不存在，则添加，并同步到redis
function UserMultiEntity:add(record, nosync)
    
    if not record.uid then return end

    local id = record[self.pk]
    if self.recordset[record.uid] and self.recordset[record.uid][id] then return end        -- 记录已经存在，返回

    if not id or id == 0 then
        id = self:getNextId()
        record[self.pk] = id
    end

    local ret = skynet.call("dbmgr", "lua", "add", self.tbname, record, self.type, nosync)
    if ret then
        if not self.recordset[record.uid] then
            self.recordset[record.uid] = {}
            setmetatable(self.recordset[record.uid], { __mode = "k" })
        end
        self.recordset[record.uid][id] = record
    end
    return ret,id
end

-- record中包含uid字段,record为k,v形式table
-- 从内存中删除，并同步到redis
function UserMultiEntity:delete(record, nosync)
    if not record.uid then return end

    local id = record[self.pk]
    if not self.recordset[record.uid] or not self.recordset[record.uid][id] then return end     -- 记录不存在，返回

    local ret = skynet.call("dbmgr", "lua", "delete", self.tbname, record, self.type, nosync)

    if ret then
        self.recordset[record.uid][id] = nil
    end

    return ret
end

-- record中包含uid字段,record为k,v形式table
-- 仅从内存中移除，但不同步到redis
function UserMultiEntity:remove(record)
    if not record.uid then return end

    local id = record[self.pk]
    if not self.recordset[record.uid] or not self.recordset[record.uid][id] then return end     -- 记录不存在，返回

    self.recordset[record.uid][id] = nil

    return true
end

-- record中包含uid字段,record为k,v形式table
function UserMultiEntity:update(record, nosync)
    if not record.uid then return end

    local id = record[self.pk]

    if not self.recordset[record.uid] or not self.recordset[record.uid][id] then return end     -- 记录不存在，返回

    local ret = skynet.call("dbmgr", "lua", "update", self.tbname, record, self.type, nosync)
    if ret then
        for k, v in pairs(record) do
            self.recordset[record.uid][id][k] = v
        end
    end

    return ret
end

-- 从内存中获取，如果不存在，说明是其他的离线玩家数据，则加载数据到redis
function UserMultiEntity:get(uid, id, field)
    if not id and not field then
        return self:getMulti(uid)
    end

    local record
    if self.recordset[uid] then
        if not field then
            record = self.recordset[uid][id] or {}
        elseif type(field) == "string" then
            if not self.recordset[uid][id] then return end
            if self.recordset[uid][id] then
                record = self.recordset[uid][id][field]
            end
        elseif type(field) == "table" then
            local t = self.recordset[uid][id]
            if t then
                record = {}
                for i=1, #field do
                    record[field[i]] = t[field[i]]
                end
            end
        end

        if record then return record end
    end

    -- 从redis获取，如果redis不存在，从mysql加载
    local orifield = field
    if type(field) == "string" then
        field = { field }
    end
    record = skynet.call("dbmgr", "lua", "get_user_multi", self.tbname, uid, id)
    if not table.empty(record) then
        if not self.recordset[uid] then
            self.recordset[uid] = {}
            setmetatable(self.recordset[uid], { __mode = "k" })
        end
        self.recordset[uid][id] = record
    end

    if type(orifield) == "string" then
        return record[orifield]
    end

    return record
end

-- 获取单个字段的值,field为string，获取多个字段的值，field为table
function UserMultiEntity:getValue(uid, id, field)
    local record = self:get(uid, id, field)
    if record then
        return record
    end
end

-- 成功返回true，失败返回false
-- 设置单个字段的值，field为string，data为值，设置多个字段的值,field为key,value形式table,data为nil
function UserMultiEntity:setValue(uid, id, field, value)
    local record = {}
    id = id or uid
    record["uid"] = uid
    record[self.pk] = id
    if value then
        record[field] = value
    else
        for k, v in pairs(field) do
            record[k] = v
        end
    end
    return self:update(record)
end


-- 内部接口
-- 多行记录，根据uid返回所有行
function UserMultiEntity:getMulti(uid)
    local rs = self.recordset[uid]

    if not rs then
        -- 从redis获取，如果redis不存在，从mysql加载
        rs = skynet.call("dbmgr", "lua", "get_user_multi", self.tbname, uid)

        self.recordset[uid] = rs
    end
    return rs
end

return UserMultiEntity
