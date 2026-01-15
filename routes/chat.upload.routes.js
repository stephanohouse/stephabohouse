const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const { upload } = require("../middleware/chatUpload.middleware");
const chatController = require("../controllers/chat.upload.controller");

// Upload chat file
router.post(
  "/upload/:roomId",
  auth, // ✅ FIX HERE
  upload.single("file"),
  chatController.uploadChatFile
);

// Delete chat file
router.delete(
  "/file/:messageId",
  auth, // ✅ FIX HERE
  chatController.deleteChatFile
);

module.exports = router;
