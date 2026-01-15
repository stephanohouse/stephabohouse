const axios = require("axios");
const {
  User,
  Role,
  TelegramAccount,
  NotificationRule,
  NotificationLog,
} = require("../models");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

/**
 * Send message to Telegram
 */
const sendTelegramMessage = async (chatId, message) => {
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }
  );
};

/**
 * Notify users by event + always notify admin (if configured)
 */
const notifyByEvent = async (event, message) => {
  // 🔔 Send to ADMIN (from .env)
  if (ADMIN_CHAT_ID) {
    try {
      await sendTelegramMessage(ADMIN_CHAT_ID, message);
    } catch (err) {
      console.error("Failed to send admin Telegram message", err.response?.data || err);
    }
  }

  // 🔔 Existing rule-based notifications
  const rules = await NotificationRule.findAll({
    where: { event },
    include: {
      model: Role,
      include: {
        model: User,
        include: TelegramAccount,
      },
    },
  });

  for (const rule of rules) {
    for (const user of rule.Role.Users) {
      if (!user.TelegramAccount) continue;

      try {
        await sendTelegramMessage(
          user.TelegramAccount.chatId,
          message
        );

        // 🔐 Audit log
        await NotificationLog.create({
          event,
          targetType: "USER",
          targetId: user.id,
          message,
        });
      } catch (err) {
        console.error(
          `Failed to notify user ${user.id}`,
          err.response?.data || err
        );
      }
    }
  }
};

module.exports = { notifyByEvent };
