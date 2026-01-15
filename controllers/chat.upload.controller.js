const { ChatRoom, ChatMessage, User } = require("../models");
const { uploadToCloudinary } = require("../middleware/chatUpload.middleware");

exports.uploadChatFile = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Check room access
    const room = await ChatRoom.findByPk(roomId, {
      include: {
        model: User,
        as: "Users",
        through: { attributes: [] },
        attributes: ["id"],
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isMember = room.Users.some(u => u.id === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Upload to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(req.file, req.user.id);
    } catch (uploadError) {
      console.error("Cloudinary upload failed:", uploadError);
      return res.status(500).json({ 
        message: "File upload failed", 
        error: uploadError.message 
      });
    }

    // Determine file type
    let fileType = "document";
    if (req.file.mimetype.startsWith("image/")) {
      fileType = "image";
    } else if (req.file.mimetype === "application/pdf") {
      fileType = "pdf";
    }

    // Create message with Cloudinary URL
    const message = await ChatMessage.create({
      ChatRoomId: roomId,
      UserId: req.user.id,
      fileUrl: cloudinaryResult.secure_url, // Use Cloudinary secure URL
      fileType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      message: null,
      // Optional: Store Cloudinary public ID for future management
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryFormat: cloudinaryResult.format,
    });

    const fullMessage = await ChatMessage.findByPk(message.id, {
      include: {
        model: User,
        attributes: ["id", "fullName", "email", "profileImage"],
      },
    });

    // 🔥 SOCKET EMIT
    const io = req.app.get("io");
    io.to(`room_${roomId}`).emit("newMessage", fullMessage);

    return res.status(201).json(fullMessage);
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};

// Optional: Add a file delete function
exports.deleteChatFile = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await ChatMessage.findByPk(messageId, {
      include: [{
        model: User,
        attributes: ["id"]
      }]
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check permission
    if (message.UserId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this file" });
    }

    // If file is stored in Cloudinary, delete it
    if (message.cloudinaryPublicId) {
      const cloudinary = require("../config/cloudinary");
      await cloudinary.uploader.destroy(message.cloudinaryPublicId);
    }

    // Soft delete the message
    await message.update({ isDeleted: true });

    // Notify room members
    const io = req.app.get("io");
    io.to(`room_${message.ChatRoomId}`).emit("messageDeleted", { id: messageId });

    return res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ message: err.message });
  }
};

// Make sure to also export the functions properly
module.exports = exports;