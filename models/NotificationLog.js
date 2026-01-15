module.exports = (sequelize, DataTypes) => {
  return sequelize.define("NotificationLog", {
    event: DataTypes.STRING,
    targetType: DataTypes.STRING,
    targetId: DataTypes.STRING,
    message: DataTypes.TEXT,
  });
};
