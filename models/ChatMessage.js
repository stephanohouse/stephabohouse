module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define("ChatMessage", {
    message: DataTypes.TEXT,

    // 👀 Read receipt
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // 🗑️ Soft delete
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // ❤️ Reactions
    reactions: {
      type: DataTypes.JSON,
      defaultValue: {},
    },

    // 📎 File support
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileType: {
      type: DataTypes.STRING, // image | document
      allowNull: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.ChatRoom, {
      foreignKey: "ChatRoomId",
    });

    ChatMessage.belongsTo(models.User, {
      foreignKey: "UserId",
    });
  };

  return ChatMessage;
};

