module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone: DataTypes.STRING,
      password: DataTypes.STRING,
      isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
      profileImage: DataTypes.STRING,
      isKycCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
      isKycApproved: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  User.associate = (models) => {
    // User ↔ Role many-to-many handled in index.js
    // User ↔ ChatRoom many-to-many
    User.belongsToMany(models.ChatRoom, { through: "ChatRoomUsers", as: "ChatRooms" });

    // User has many ChatMessages (explicit foreignKey UserId)
    User.hasMany(models.ChatMessage, { foreignKey: "UserId", as: "Messages" });

    // Other associations (Roles, Tickets, Bookings) are handled in index.js
  };

  return User;
};
