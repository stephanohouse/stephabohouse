const { ChatRoom, User, ChatMessage } = require("../models");
const { Op } = require("sequelize");

/**
 * Get all chat rooms for current user - FIXED
 */
exports.getUserRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.findAll({
      include: [
        {
          model: User,
          as: "Users",
          through: { attributes: [] },
          attributes: ["id", "fullName", "email", "profileImage"],
          required: true,
        },
        {
          model: ChatMessage,
          as: "Messages",
          separate: true,
          limit: 1,
          where: { isDeleted: false },
          order: [["createdAt", "DESC"]],
          attributes: [
            "id",
            "message",
            "createdAt",
            "UserId",
            "fileUrl",
            "fileType",
            "fileName",
          ],
        },
      ],
    });

    const userRooms = rooms.filter((room) =>
      room.Users.some((u) => u.id === req.user.id)
    );

    const formattedRooms = userRooms.map((room) => {
      const r = room.toJSON();

      if (r.type === "direct") {
        const other = r.Users.find((u) => u.id !== req.user.id);
        r.displayName = other?.fullName || other?.email;
        r.otherUser = other;
      } else {
        r.displayName = r.name;
      }

      r.lastMessage = r.Messages?.[0] || null;
      delete r.Messages;

      return r;
    });

    // sort safely in JS
    formattedRooms.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.createdAt) -
        new Date(a.lastMessage.createdAt)
      );
    });

    res.json(formattedRooms);
  } catch (err) {
    console.error("Error fetching user rooms:", err);
    res.status(500).json({ message: err.message });
  }
};


/**
 * Create a group chat room
 */
exports.createRoom = async (req, res) => {
  try {
    const { name, userIds = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Room name is required" });
    }

    // Create the room
    const room = await ChatRoom.create({
      name,
      type: "group",
    });

    // Add creator and other users
    const allUserIds = [req.user.id, ...userIds];
    await room.addUsers(allUserIds);

    // Fetch the created room with users
    const createdRoom = await ChatRoom.findByPk(room.id, {
      include: [
        {
          model: User,
          as: 'Users', // ✅ Add 'as' keyword
          through: { attributes: [] },
          attributes: ['id', 'fullName', 'email', 'profileImage']
        }
      ]
    });

    res.status(201).json(createdRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create or get direct chat - OPTIMIZED
 */
exports.createDirectRoom = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ message: "Cannot create chat with yourself" });
    }

    // Check if direct room already exists
    const existingRooms = await ChatRoom.findAll({
      where: { type: 'direct' },
      include: [
        {
          model: User,
          as: 'Users',
          through: { attributes: [] },
          attributes: ['id'],
          required: true
        }
      ]
    });

    const existingRoom = existingRooms.find(room => {
      const userIds = room.Users.map(user => user.id);
      return (
        userIds.includes(req.user.id) &&
        userIds.includes(userId) &&
        userIds.length === 2
      );
    });

    if (existingRoom) {
      const roomWithDetails = await ChatRoom.findByPk(existingRoom.id, {
        include: [
          {
            model: User,
            as: 'Users',
            through: { attributes: [] },
            attributes: ['id', 'fullName', 'email', 'profileImage']
          }
        ]
      });
      return res.json(roomWithDetails);
    }

    // ✅ FIX STARTS HERE
    const sortedIds = [req.user.id, userId].sort();
    const roomName = `direct_${sortedIds[0]}_${sortedIds[1]}`;

    const room = await ChatRoom.create({
      type: "direct",
      name: roomName
    });
    // ✅ FIX ENDS HERE

    // Add both users
    await room.addUsers([req.user.id, userId]);

    const createdRoom = await ChatRoom.findByPk(room.id, {
      include: [
        {
          model: User,
          as: 'Users',
          through: { attributes: [] },
          attributes: ['id', 'fullName', 'email', 'profileImage']
        }
      ]
    });

    res.status(201).json(createdRoom);
  } catch (error) {
    console.error('Error creating direct room:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get messages for a chat room
 */
exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if user has access to this room
    const room = await ChatRoom.findOne({
      where: { id: roomId },
      include: [
        {
          model: User,
          as: 'Users', // ✅ Add 'as' keyword
          through: { attributes: [] },
          attributes: ['id'],
          required: true
        }
      ]
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if current user is in room
    const userInRoom = room.Users.some(user => user.id === req.user.id);
    if (!userInRoom) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await ChatMessage.findAll({
      where: { 
        ChatRoomId: roomId,
        isDeleted: false 
      },
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'fullName', 'profileImage']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * Get users for creating new chats
 */
exports.getAvailableUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.user.id },
        isActive: true
      },
      attributes: ['id', 'fullName', 'email', 'profileImage', 'isActive'],
      limit: 100
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
};