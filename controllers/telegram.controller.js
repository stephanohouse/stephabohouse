const { TelegramAccount } = require("../models");

exports.connectTelegram = async (req, res) => {
  const { chatId, username, firstName } = req.body;

  await TelegramAccount.findOrCreate({
    where: { chatId },
    defaults: {
      username,
      firstName,
      UserId: req.user.id,
    },
  });

  res.json({ message: "Telegram connected successfully" });
};
