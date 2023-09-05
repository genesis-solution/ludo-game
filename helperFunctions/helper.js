const History = require("../models/history");
const Account = require("../models/accounts");
const userSockets = require("../allSocketConnection");
const challengesController = require("../controllers/challenges");

async function generateHistory(historyObj, session) {
  try {
    const history = new History();
    history.userId = historyObj.userId;
    history.historyText = historyObj.historyText;
    history.createdAt = new Date();
    history.closingBalance = historyObj.closingBalance;
    history.amount = historyObj.amount;
    history.type = historyObj.type;
    if (historyObj.status) {
      history.status = historyObj.status;
    }
    if (historyObj.roomCode) {
      history.roomCode = historyObj.roomCode;
    }
    if (historyObj.transactionId) {
      history.transactionId = historyObj.transactionId;
    }

    await history.save({ session });

    return history;
  } catch (error) {
    console.error("Error creating History", error);
    throw error;
  }
}
async function socketOnLogout(userId) {
  try {
    const userIdString = userId.toString();
    if (userSockets.has(userIdString)) {
      const previousSocket = userSockets.get(userIdString);
      previousSocket.disconnect();
      userSockets.delete(userIdString);
      console.log(`Socket connection closed for user ID: ${userId}`);
    }
  } catch (error) {
    console.error("Error disconnecting socket:", error);
  }
}

async function calculateChips(account, amount) {
  const chips = { winningCash: 0, depositCash: 0 };

  if (account.depositCash >= amount) {
    account.depositCash -= amount;
    account.wallet -= amount;
    chips.depositCash = amount;
  } else {
    const remaining = amount - account.depositCash;
    if (account.winningCash < remaining) {
      throw new Error(`Insufficient balance for ${account.userId}`);
    } else {
      chips.depositCash = account.depositCash;
      chips.winningCash = remaining;
      account.depositCash = 0;
      account.winningCash -= remaining;
      account.wallet -= amount;
    }
  }

  return chips.depositCash !== 0 || chips.winningCash !== 0 ? chips : null;
}

module.exports = {
  generateHistory,

  calculateChips,
  socketOnLogout,
};
