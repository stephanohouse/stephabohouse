const { ChatMessage, ChatRoom, Role, User } = require("../models");
const { onlineUsers } = require("./presence.store");
const { Op } = require("sequelize");

module.exports = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    /* ─────────────────────
       🟢 USER ONLINE
    ───────────────────── */
    onlineUsers.add(userId);
    io.emit("userOnline", { userId });

    console.log("🟢 Authenticated user connected:", userId);

    /* ─────────────────────
       🔐 AUTO-JOIN ROOMS BY ROLE
    ───────────────────── */
    const userWithRoles = await User.findByPk(userId, {
      include: {
        model: Role,
        include: [ChatRoom],
      },
    });

    if (userWithRoles?.Roles) {
      for (const role of userWithRoles.Roles) {
        for (const room of role.ChatRooms || []) {
          socket.join(`room_${room.id}`);
          console.log(
            `➡️ User ${userId} auto-joined room ${room.id} (${room.name})`
          );
        }
      }
    }

    /* ─────────────────────
       🔑 JOIN ROOM MANUALLY
    ───────────────────── */
    socket.on("joinRoom", (roomId) => {
      socket.join(`room_${roomId}`);
      console.log(`➡️ User ${userId} joined room_${roomId}`);
    });

    /* ─────────────────────
       SEND MESSAGE
    ───────────────────── */
    socket.on("sendMessage", async ({ roomId, message }) => {
      if (!message || !roomId) return;

      const msg = await ChatMessage.create({
        message,
        ChatRoomId: roomId,
        UserId: userId,
      });

      const fullMessage = await ChatMessage.findByPk(msg.id, {
        include: [{ model: User }],
      });

      io.to(`room_${roomId}`).emit("newMessage", fullMessage);
    });

    /* ─────────────────────
       ⌨️ TYPING INDICATOR
    ───────────────────── */
    socket.on("typing", ({ roomId }) => {
      socket.to(`room_${roomId}`).emit("userTyping", { userId });
    });

    socket.on("stopTyping", ({ roomId }) => {
      socket.to(`room_${roomId}`).emit("userStoppedTyping", { userId });
    });

    /* ─────────────────────
       ✏️ EDIT MESSAGE
    ───────────────────── */
    socket.on("editMessage", async ({ messageId, newMessage }) => {
      const msg = await ChatMessage.findByPk(messageId);
      if (!msg || msg.UserId !== userId) return;

      msg.message = newMessage;
      await msg.save();

      io.to(`room_${msg.ChatRoomId}`).emit("messageEdited", {
        messageId,
        newMessage,
      });
    });

    /* ─────────────────────
       🗑️ DELETE MESSAGE
    ───────────────────── */
    socket.on("deleteMessage", async ({ messageId }) => {
      const msg = await ChatMessage.findByPk(messageId);
      if (!msg || msg.UserId !== userId) return;

      msg.isDeleted = true;
      msg.message = "🗑️ Message deleted";
      await msg.save();

      io.to(`room_${msg.ChatRoomId}`).emit("messageDeleted", { messageId });
    });

    /* ─────────────────────
       ❤️ REACTIONS
    ───────────────────── */
    socket.on("reactMessage", async ({ messageId, emoji }) => {
      const msg = await ChatMessage.findByPk(messageId);
      if (!msg) return;

      const reactions = msg.reactions || {};
      reactions[emoji] = reactions[emoji] || [];

      const index = reactions[emoji].indexOf(userId);
      index === -1
        ? reactions[emoji].push(userId)
        : reactions[emoji].splice(index, 1);

      if (!reactions[emoji].length) delete reactions[emoji];

      msg.reactions = reactions;
      await msg.save();

      io.to(`room_${msg.ChatRoomId}`).emit("messageReactionUpdated", {
        messageId,
        reactions,
      });
    });

    /* ─────────────────────
       👀 READ RECEIPTS
    ───────────────────── */
    socket.on("markAsRead", async ({ roomId }) => {
      await ChatMessage.update(
        { isRead: true },
        {
          where: {
            ChatRoomId: roomId,
            UserId: { [Op.ne]: userId },
          },
        }
      );

      io.to(`room_${roomId}`).emit("messagesRead", {
        roomId,
        userId,
      });
    });

    /* ─────────────────────
       🔴 USER OFFLINE
    ───────────────────── */
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("userOffline", { userId });
      console.log("🔴 User disconnected:", userId);
    });
  });
};
