const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload.middleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.me);

// ✅ PROFILE IMAGE UPLOAD
router.post(
  "/profile/image",
  authMiddleware,
  upload.single("image"),
  authController.uploadProfileImage
);

module.exports = router;
