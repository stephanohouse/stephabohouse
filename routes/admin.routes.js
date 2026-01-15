const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const can = require("../middleware/permission.middleware");


router.use(authMiddleware);

router.get("/users", can("manage_users"), adminController.getAllUsers);
router.patch("/users/:userId/status", can("manage_users"), adminController.updateUserStatus);
router.post("/users/:userId/roles", can("manage_users"), adminController.assignRole);

module.exports = router;
