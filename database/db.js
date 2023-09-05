// db.js
const mongoose = require("mongoose");
const config = require('../helpers/config');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log(config.DB_URI);
    await mongoose.connect(config.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      retryWrites: false
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
