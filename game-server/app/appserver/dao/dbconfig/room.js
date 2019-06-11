module.exports = function (sequelize, Sequelize) {
  return sequelize.define('room', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {//房间名
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: ''
    },
    desc: {//房间描述
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: ''
    },
    info: {//桌子配置信息
      type: Sequelize.JSON,
      allowNull: true
    },
    tableClass: {//所分配的桌子类
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: ''
    },
    serverId: {//所分配的服务器id
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: ''
    },
    tableCount: { //房间桌子数
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    userCount: {  //一桌几人打牌
      type: Sequelize.INTEGER,
      defaultValue: 4
    },
    enterLimit: { //准入值
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    baseBean: { //底注
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    fee: { //服务费
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    visual: { // 是否可见
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    orderBy: { //排序
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
  }, {
    freezeTableName: true // Model 对应的表名将与model名相同
  });
}