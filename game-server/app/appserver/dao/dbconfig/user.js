module.exports = function (sequelize, Sequelize) {
  return sequelize.define('user', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    uid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      unique: true
    },
    nick: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: ''
    },
    password: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: ''
    },
    score: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    win: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    lose: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    role: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '0'
    },
    gold: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    bean: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    sex: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 2
    },
    isOnline: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    device: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: ''
    },
    mobile: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    },
    vipEndTime: {
      type: Sequelize.DATE,
      allowNull: true
    },
  }, {
    freezeTableName: true // Model 对应的表名将与model名相同
  });
}