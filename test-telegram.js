require('dotenv').config();
const sendTelegramMessage = require('./utils/telegram.service');

// Test message
sendTelegramMessage('🤖 Bot is working! Test notification received victor too bad.');