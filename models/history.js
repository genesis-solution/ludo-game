const mongoose = require("mongoose");
const schema = mongoose.Schema;
let historySchema = new mongoose.Schema({
  userId: {
    type: schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  type: {
    type: String, //0 for buy and 1 for sell
    required: true,
  },
  status: {
    type: String,
    default: null,
  },
  roomCode: {
    type: String,
    default: null,
  },
  upiId: {
    type: String,
    default: null,
  },
  amount: {
    type: Number,
    required: true,
  },
  historyText: {
    type: String,
    required: true,
  },
  closingBalance: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  transactionId: {
    type: String,
    default: null,
  },
});

let History = mongoose.model("history", historySchema);
module.exports = History;
