// In your chatroom routes file
const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/chatroom.controller");

router.get("/", auth, controller.getUserRooms);
router.post("/", auth, controller.createRoom);
router.post("/direct", auth, controller.createDirectRoom);
router.get("/:roomId/messages", auth, controller.getRoomMessages);
router.get("/users/available", auth, controller.getAvailableUsers); // Add this

module.exports = router;