const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/paystack.webhook.controller");

// ⚠️ RAW BODY REQUIRED
router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  webhookController.handlePaystackWebhook
);

module.exports = router;
