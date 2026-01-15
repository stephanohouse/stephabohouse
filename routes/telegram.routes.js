const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { connectTelegram } = require("../controllers/telegram.controller");

router.post("/connect", auth, connectTelegram);

module.exports = router;
