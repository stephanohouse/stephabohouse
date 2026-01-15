module.exports = (sequelize, DataTypes) => {
  const NotificationRule = sequelize.define("NotificationRule", {
    event: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  NotificationRule.associate = (models) => {
    NotificationRule.belongsTo(models.Role);
  };

  return NotificationRule;
};
