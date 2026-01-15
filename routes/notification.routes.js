const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const can = require("../middleware/permission.middleware");
const controller = require("../controllers/notification.controller");

router.post("/", auth, can("manage_notifications"), controller.createRule);

router.get(
  "/rules",
  auth,
  can("manage_notifications"),
  controller.getRules
);

router.delete(
  "/rules/:id",
  auth,
  can("manage_notifications"),
  controller.deleteRule
);

module.exports = router;
