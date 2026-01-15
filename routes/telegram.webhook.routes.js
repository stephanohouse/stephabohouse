const router = require("express").Router();
const controller = require("../controllers/telegram.webhook.controller");

router.post("/webhook", controller.telegramWebhook);

module.exports = router;
