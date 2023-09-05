const express = require("express");
const accountController = require("../controllers/accounts");
const userController = require("../controllers/user");
const { responseHandler } = require("../helpers");
const verifyToken = require("../middleware/verifyToken");
const Challenge = require("../models/challenges");
const router = express.Router();

router.get("/getUserProfileData", verifyToken, async (req, res) => {
  try {
    let user = req.user;
    let userData = await userController.existingUserById(user);

    if (!userData) {
      return responseHandler(res, 400, null, "User not found");
    }

    let account = await accountController.getAccountByUserId(user.id);
    userData._doc.account = account;

    const count = await Challenge.countDocuments({
      $or: [{ creator: user.id }, { player: user.id }],
      state: { $nin: ["playing", "open", "requested"] },
    });
    userData._doc.gamesPlayed = count;


    return responseHandler(res, 200, userData, null);
  } catch (error) {

    return responseHandler(res, 400, null, error.message);
  }
});

router.post("/updateUserProfile", verifyToken, async (req, res) => {
  try {
    let user = req.user;
    let name = req.body.username;
    let existing = await userController.existingUserByName(name);
    let userData = await userController.existingUserById(user);
    if (!userData) {
      return responseHandler(res, 400, null, "User not found");
    } else {
      if (!existing) {
        let userObj = { ...req.body, phone: userData.phone };
        userData = await userController.updateUserByPhoneNumber(userObj);
      }
    }

    let account = await accountController.getAccountByUserId(user.id);
    userData._doc.account = account;
    const count = await Challenge.countDocuments({
      $or: [{ creator: user.id }, { player: user.id }],
      state: { $nin: ["playing", "open", "requested"] },
    });
    userData._doc.gamesPlayed = count;
    if (existing) {
      return responseHandler(res, 200, userData, "username already exist");
    }
    return responseHandler(res, 200, userData, "Profile Updated");
  } catch (error) {
    return responseHandler(res, 400, null, error.message);
  }
});
module.exports = router;
