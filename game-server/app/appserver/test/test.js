let db = require('../../../app/appserver/dao/dbconnect');
db.initConnect();
db.room.findAll({
  where: { visual: 1, serverId: "room-1" }
})
  .then((result) => {
    console.log(result)
    for (let i = 0; i < result.length; i++){
      console.log(result[i].id);
      console.log(result[i].name);
      console.log(result[i].desc);
      console.log(result[i].info);
      console.log(result[i].serverId);
    }
  })