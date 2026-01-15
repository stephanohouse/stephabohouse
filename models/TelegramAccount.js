module.exports = (sequelize, DataTypes) => {
  const TelegramAccount = sequelize.define("TelegramAccount", {
    chatId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: DataTypes.STRING,
    firstName: DataTypes.STRING,
  });

  TelegramAccount.associate = (models) => {
    TelegramAccount.belongsTo(models.User, { onDelete: "CASCADE" });
  };

  return TelegramAccount;
};
