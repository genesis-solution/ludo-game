const mongoose = require("mongoose");
const schema = mongoose.Schema;
let userAccount = new mongoose.Schema({
  userId: {
    type: schema.Types.ObjectId,
    ref: "users",
  },
  wallet: {
    type: Number,
    default: 0,
  },
  referelBalance: {
    type: Number,
    default: 0,
  },
  depositCash: {
    type: Number,
    default: 0,
  },
  winningCash: {
    type: Number,
    default: 0,
  },
  totalLose: {
    type: Number,
    default: 0,
  },
  totalPenalty: {
    type: Number,
    default: 0,
  },
  totalWin: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  isBlocked: {
    type: Boolean,
    default: false,
    required: false,
  },
});

let UserAccount = mongoose.model("UserAccount", userAccount);
module.exports = UserAccount;
