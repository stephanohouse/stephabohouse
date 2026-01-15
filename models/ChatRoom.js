module.exports = (sequelize, DataTypes) => {
  const ChatRoom = sequelize.define(
    "ChatRoom",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("role", "direct", "group"),
        defaultValue: "group",
      },
    },
    {
      tableName: "chat_rooms",
      timestamps: true,
    }
  );

  ChatRoom.associate = (models) => {
    // ChatRoom belongs to a Role (optional, for role-based chat rooms)
    ChatRoom.belongsTo(models.Role);

    // ChatRoom ↔ User many-to-many
    ChatRoom.belongsToMany(models.User, { through: "ChatRoomUsers", as: "Users" });


    // ChatRoom has many ChatMessages (capitalized foreign key 'ChatRoomId')
    ChatRoom.hasMany(models.ChatMessage, { foreignKey: "ChatRoomId", as: "Messages" });
  };

  return ChatRoom;
};
