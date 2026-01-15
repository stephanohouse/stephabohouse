const { User, TelegramAccount } = require("../models");

exports.telegramWebhook = async (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (!text.startsWith("/connect")) return res.sendStatus(200);

  const email = text.split(" ")[1];
  if (!email) return res.send("Usage: /connect email@example.com");

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.send("❌ No user found with this email");
  }

  await TelegramAccount.findOrCreate({
    where: { chatId },
    defaults: {
      username: message.from.username,
      firstName: message.from.first_name,
      UserId: user.id,
    },
  });

  res.send("✅ Telegram connected successfully!");
};
