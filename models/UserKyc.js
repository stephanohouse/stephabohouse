// models/UserKyc.js
module.exports = (sequelize, DataTypes) => {
  const UserKyc = sequelize.define("UserKyc", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    documentType: {
      type: DataTypes.ENUM("NIN", "VOTERS_CARD", "PASSPORT", "DRIVERS_LICENSE"),
      allowNull: false,
    },

    documentNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    documentImage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  UserKyc.associate = (models) => {
    UserKyc.belongsTo(models.User, { onDelete: "CASCADE" });
  };

  return UserKyc;
};
