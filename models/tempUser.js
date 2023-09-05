const mongoose = require("mongoose");
let tempUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    required: true,
    default: "2.png",
  },
  phone: {
    type: String,
    minlength: 10,
    maxlength: 10,
  },
  joinedAt: {
    type: Date,
    required: false,
    default: new Date(),
  },
  otpConfirmed: {
    type: Boolean,
    required: false,
    default: false,
  },
  otp: {
    code: {
      type: Number,
      require: false,
    },
    updatedAt: {
      type: Date,
      default: Date(),
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  referer: {
    type: Number,
  },
  totalRefer: {
    type: Number,
    default: 0,
  },
  referCode: {
    type: Number,
    default: null,
  },
  // total cash
  fake: {
    type: Boolean,
    default: false,
  },
  // winning cash

  
  noOfChallenges: {
    type: Number,
    default: 0,
  },
  isBlocked: {
    type: Boolean,
    default: false,
    required: false,
  },
  jwtToken: {
    jwtToken: { type: String, default: "" },
    createdAt: { type: Date, default: new Date() },
  },
  loggedDevices: [
    {
      notificationToken: { type: String, default: "" },
      deviceId: { type: String, required: true },
      jwtToken: { type: String, default: "" },
      ipAddress: { type: String, default: "" },
      createdAt: { type: Date, default: new Date() },
    },
  ],
});
let tempUser = mongoose.model("tempUser", tempUserSchema);
module.exports = tempUser;
