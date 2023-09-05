const TelegramBot = require("node-telegram-bot-api");

class TelegramBotHandler {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
  }

  sendMessageToGroup(groupId, message) {
    this.bot.sendMessage(groupId, message);
  }
}

module.exports = TelegramBotHandler;
