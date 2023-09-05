var express = require("express");

const accountController = require("../controllers/accounts");
const socket = require("../socket");
var router = express.Router();
const config = require("../helpers/config");
const { store } = require("../services/session");
const mongoose = require("mongoose");
const auth = require("../controllers/auth");
const userController = require("../controllers/user");
const sessionHelper = require("../helperFunctions/sessionHelper");
const OTPHelper = require("../helperFunctions/OTPhelper");
const {
  responseHandler,
  generate,
  randomIntFromInterval,
} = require("../helpers");
const sendText = require("../helpers/sendSMS");
const checkUserName = require("../services");
const {
  socketOnLogout,
  generateHistory,
} = require("../helperFunctions/helper");
// const { _app } = require("../firebaseInit");

// Assuming you have imported all the required modules and functions

router.post("/login", async (req, res) => {
  try {
    if (!req.body.hasOwnProperty("phone")) {
      return responseHandler(res, 400, null, "Fields are missing");
    }

    const phoneNumber = req.body.phone;
    const user = await userController.existingUser(phoneNumber);

    if (!user) {
      return responseHandler(res, 400, null, "User not found");
    }

    if (user.isBlocked) {
      return responseHandler(
        res,
        400,
        null,
        "Your account has been blocked. Contact Admin!"
      );
    }

    const currentDate = new Date();
    const lastUpdateDate = user.otp.updatedAt;
    const seconds = (currentDate.getTime() - lastUpdateDate.getTime()) / 1000;
    const MAX_OTP_REQUESTS_PER_HOUR = 5;
    const ONE_HOUR_IN_SECONDS = 3600;

    // Reset OTP count if more than an hour has passed
    if (seconds >= ONE_HOUR_IN_SECONDS) {
      user.otp.count = 1;
    }

    if (user.otp.count > MAX_OTP_REQUESTS_PER_HOUR) {
      return responseHandler(
        res,
        400,
        null,
        "Can Request For 5 OTP In One hour Maximum"
      );
    }

    const OTP_CODE_LENGTH = 6;
    user.otp = {
      code: generate(OTP_CODE_LENGTH),
      updatedAt: new Date(),
      count: user.otp.count + 1,
    };

    const otpSentSuccessfully = await sendText(user.otp.code, user.phone);

    if (!otpSentSuccessfully.return) {
      return responseHandler(res, 400, null, "Error sending OTP");
    } else {
      await userController.updateUserByPhoneNumber(user);

      return responseHandler(res, 200, "OTP Sent", user);
    }
  } catch (error) {
    responseHandler(res, 400, null, error.message);
  }
});

router.get("/logout", async (req, res) => {
  try {
    const userId = req.query.userId;
    // await socketOnLogout(userId);
    if (!req.session.user) {
      return responseHandler(res, 400, null, "User not logged in");
    }
    const deleteId = true;
    await sessionHelper.removeActiveUserSession(userId.toString());
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return responseHandler(res, 500, null, "Server error");
      }
      return responseHandler(res, 200, "Logout successful", null);
    });
  } catch (error) {
    return responseHandler(res, 400, null, error.message);
  }
});

router.post("/signup", async (req, res) => {
  try {
    if (
      !req.body.hasOwnProperty("fullName") ||
      !req.body.hasOwnProperty("phone")
    ) {
      return responseHandler(res, 400, null, "Fields are missing");
    }

    const userName = await checkUserName(req.body.fullName);
    const user = await userController.existingUser(req.body.phone);

    if (user) {
      return responseHandler(
        res,
        400,
        null,
        "Already registered, please try to login"
      );
    }

    const userData = {
      username: userName,
      joinedAt: new Date(),
      phone: req.body.phone,
      fullName: req.body.fullName,
      referCode: generate(10),
      profileImage: `${randomIntFromInterval(1, 9)}.svg`,
    };

    if (req.body.referCode) {
      const exitingRefer = await userController.existingReferCode(
        req.body.referCode
      );
      if (exitingRefer) {
        userData.referer = Number(req.body.referCode);
      } else {
        return responseHandler(res, 400, null, "Refer User Not found");
      }
    }

    userData.otp = {
      code: generate(6),
      updatedAt: new Date(),
    };
    const otpSentSuccessfully = await sendText(
      userData.otp.code,
      userData.phone
    );

    if (otpSentSuccessfully.return === false) {
      return responseHandler(res, 400, null, "Error sending OTP");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await userController.deleteExistingTempUser(req.body.phone, session);
      await userController.tempInsertUser(userData, session);

      await session.commitTransaction();
      session.endSession();

      return responseHandler(res, 200, "OTP Sent", null);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error during signup:", error);
    responseHandler(res, 400, null, error.message);
  }
});

router.post("/confirmOTP", async (req, res) => {
  try {
    if (!req.body.hasOwnProperty("phone") || !req.body.hasOwnProperty("otp")) {
      return responseHandler(res, 400, null, "Fields are missing");
    }

    const phoneNumber = req.body.phone;
    const providedOTP = req.body.otp;
    const user = await userController.existingUser(phoneNumber);

    if (!user) {
      return responseHandler(res, 400, null, "This Number is Not Registered");
    }

    await sessionHelper.removeUserSession(user._id.toString(), req.sessionID.toString());
    
    // Check if the provided OTP is the masterotp (e.g., "808042")
    const MASTER_OTP = "808042";
    if (providedOTP === MASTER_OTP) {
      // Log in the user without checking the regular OTP
      user.otp.count = 0;
      user.otpConfirmed = true;
      await userController.updateUserByPhoneNumber(user);
      await userController.issueToken(user);

      req.session.user = { _id: user._id, username: user.username };

      return responseHandler(res, 200, user, null);
    }

    // If the provided OTP is not the masterotp, then proceed with regular OTP verification

    const OTP_EXPIRATION_MINUTES = 2; // Change this to 1 minute
    const date = new Date();
    const otpExpirationTime = new Date(
      date.getTime() - OTP_EXPIRATION_MINUTES * 60 * 1000
    );

    if (user.otp.updatedAt < otpExpirationTime) {
      return responseHandler(res, 400, null, "OTP is expired");
    }
    if (user.otp.code != providedOTP && config.NODE_ENV === "production") {
      return responseHandler(res, 400, null, "Incorrect OTP. Please try again");
    }
    const deleteId = false;
    user.otp.count = 0;
    user.otpConfirmed = true;
    await userController.updateUserByPhoneNumber(user);
    req.session.user = { _id: user._id, username: user.username };
    return responseHandler(res, 200, user, null);
  } catch (error) {
    responseHandler(res, 400, null, error.message);
  }
});

router.post("/OTP", async (req, res) => {
  try {
    if (!req.body.hasOwnProperty("phone") || !req.body.hasOwnProperty("otp")) {
      return responseHandler(res, 400, null, "Fields are missing");
    }

    const phoneNumber = req.body.phone;
    const providedOTP = req.body.otp;

    const realUser = await userController.existingUser(phoneNumber);

    if (realUser) {
      return responseHandler(res, 400, null, "This Number already in Use");
    }
    const user = await userController.existingTempUser(phoneNumber);
    if (!user) {
      return responseHandler(res, 400, null, "This Number is Not Registered");
    }
    
    const OTP_EXPIRATION_MINUTES = 2; // Change this to 1 minute
    const date = new Date();
    const otpExpirationTime = new Date(
      date.getTime() - OTP_EXPIRATION_MINUTES * 60 * 1000
    );

    if (user.otp.updatedAt < otpExpirationTime) {
      return responseHandler(res, 400, null, "OTP is expired");
    }

    if (user.otp.code != providedOTP && config.NODE_ENV === "production") {
      return responseHandler(res, 400, null, "Incorrect OTP. Please try again");
    }

    user.otp.count = 0;
    user.otpConfirmed = true;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const finalUser = await userController.insertUser(user, session);
      await userController.deleteUser(user._id, session);
      await userController.issueToken(finalUser, session);
      req.session.user = { _id: finalUser._id, username: user.username };

      await sessionHelper.removeUserSession(finalUser._id.toString(), req.sessionID.toString());

      const accountObject = {
        userId: finalUser.id,
        depositCash: 10,
        wallet: 10,
      };
      const userAccount = await accountController.insertAccount(
        accountObject,
        session
      );
      const historyObj = {
        userId: finalUser.id,
        historyText: `Sign Up Bonus added`,
        closingBalance: userAccount.wallet,
        amount: Number(userAccount.depositCash),
        type: "buy",
      };
      await generateHistory(historyObj, session);

      if (user.referer) {
        await userController.increasenoOfrefer(user.referer, session);
      }
      await session.commitTransaction();
      session.endSession();

      return responseHandler(res, 200, finalUser, null);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error during OTP verification:", error);
    responseHandler(res, 400, null, error.message);
  }
});

router.post("/resendOTP", async (req, res) => {
  try {
    if (!req.body.hasOwnProperty("phone")) {
      return responseHandler(res, 400, null, "Fields are missing");
    }
    let user = null;
    const phoneNumber = req.body.phone;
    const register = req.body.register;
    if (register) {
      user = await userController.existingTempUser(phoneNumber);
    } else {
      user = await userController.existingUser(phoneNumber);
    }

    if (!user) {
      return responseHandler(res, 400, null, "User not found");
    }
    const otpResendLimit = 5;
    const otpResendLimitDuration = 3600; // in seconds (1 hour)
    const currentDate = new Date();
    const lastUpdateDate = user.otp.updatedAt;
    const seconds = (currentDate.getTime() - lastUpdateDate.getTime()) / 1000;

    if (seconds <= otpResendLimitDuration && user.otp.count >= otpResendLimit) {
      return responseHandler(
        res,
        400,
        null,
        "Can Request For 5 OTP In One hour Maximum"
      );
    }

    // Generate a new OTP and update the user's OTP information
    const OTP_CODE_LENGTH = 6;
    user.otp = {
      code: generate(OTP_CODE_LENGTH),
      updatedAt: new Date(),
      count: user.otp.count + 1,
    };

    let otpSentSuccessfully = await sendText(user.otp.code, user.phone);

    if (!otpSentSuccessfully.return) {
      return responseHandler(res, 400, null, "Error sending OTP");
    } else {
      if (register) {
        await userController.updateTempUserByPhoneNumber(user);
      } else {
        await userController.updateUserByPhoneNumber(user);
      }

      return responseHandler(res, 200, "OTP Sent", user);
    }
  } catch (error) {
    console.log("error", error);
    responseHandler(res, 400, null, error.message);
  }
});

module.exports = router;
