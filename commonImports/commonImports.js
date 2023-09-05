const express = require("express");
const accountController = require("../controllers/accounts");
const challengesController = require("../controllers/challenges");
const transactionsController = require("../controllers/transactions");
const userController = require("../controllers/user");
const { responseHandler } = require("../helpers");
const verifyToken = require("../middleware/verifyToken");
const History = require("../models/history");
const mongoose = require("mongoose");

module.exports = {
  express,
  accountController,
  challengesController,
  transactionsController,
  userController,
  responseHandler,
  verifyToken,
  History,
  mongoose,
};
