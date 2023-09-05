const User = require("../models/user");
const ChallengeModel = require("../models/challenges");
const tempUser = require("../models/tempUser");
const config = require("../helpers/config");
const jwtToken = require("jsonwebtoken");
const userController = {
  /**
   * existingUser - Check existing user by phone Number.
   * @param number - number that need to check
   * @returns {Promise<void>}
   */
  existingUser: async (number) => {
    try {
      let user = await User.findOne({
        phone: number,
      });

      return user;
    } catch (error) {
      throw error;
    }
  },
  existingTempUser: async (number) => {
    try {
      let user = await tempUser.findOne({
        phone: number,
      });

      return user;
    } catch (error) {
      throw error;
    }
  },
  deleteExistingTempUser: async (number, session) => {
    try {
      let user = await tempUser.findOne({
        phone: number,
      });

      if (user) {
        await tempUser.deleteOne({ _id: user._id }, { session });
      }

      return user;
    } catch (error) {
      throw error;
    }
  },
  existingReferCode: async (referCode) => {
    try {
      let user = await User.findOne({
        referCode: referCode,
      });

      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * existingUserById - Check existing user by user id.
   * @param user - user that need to check
   * @returns {Promise<void>}
   */
  existingUserById: async (userData) => {
    try {
      let user = await User.findOne({
        _id: userData.id,
        isBlocked: false,
        otpConfirmed: true,
      });
      return user;
    } catch (error) {
      throw error;
    }
  },
  existingUserByName: async (name) => {
    try {
      let user = await User.findOne({
        username: name,
        isBlocked: false,
        otpConfirmed: true,
      });
      return user;
    } catch (error) {
      throw error;
    }
  },
  /**
   * existingUserByReferelId - get existing user by referel code.
   * @param referCode - referelCode that need to check
   * @returns {Promise<void>}
   */
  increasenoOfrefer: async (referCode, session) => {
    try {
      let user = await User.findOneAndUpdate(
        {
          referCode: referCode,
        },
        { $inc: { totalRefer: 1 } }, // Increment totalRefer field by 1
        { new: true, session } // Return the updated document
      );
      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * existingUserByReferelId - get existing user by referel code.
   * @param referCode - referelCode that need to check
   * @returns {Promise<void>}
   */
  existingUserByReferelId: async (referCode) => {
    try {
      let user = await User.findOne({
        referCode: referCode,
        isBlocked: false,
        otpConfirmed: true,
      });
      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * insertUser - insert user .
   * @param object - object that need to insert
   * @returns {Promise<void>}
   */
  insertUser: async (object, session) => {
    try {
      const userObject = object.toObject();
      delete userObject._id;
      delete userObject.__v;

      let user = new User(userObject);
      await user.save({ session });

      return user;
    } catch (error) {
      throw error;
    }
  },
  deleteUser: async (userId, session) => {
    try {
      const result = await tempUser.deleteOne({ _id: userId }, { session });

      return result;
    } catch (error) {
      throw error;
    }
  },
  tempInsertUser: async (object, session) => {
    try {
      let tempuser = new tempUser(object);
      await tempuser.save({ session });
      return tempuser;
    } catch (error) {
      throw error;
    }
  },

  /**
   * issueToken - issueToken function will issue JWT token against a user id.
   * @param userData - user data that need to issue token
   * @returns {Promise<void>}
   */

  issueToken: async (userData) => {
    try {
      let tokenGenerated = jwtToken.sign(
        {
          id: userData._id,
          phone: userData.phone,
        },
        config.TOKEN_SECRET
      );

      let tokenObject = {
        jwtToken: tokenGenerated,
        createdAt: new Date(),
      };
      let user = await User.findOneAndUpdate(
        { phone: userData.phone },
        { $set: { jwtToken: tokenObject } },
        { new: true }
      );
      if (!userData.hasOwnProperty("jwtToken")) {
        userData.jwtToken = {};
      }
      userData.jwtToken = tokenObject;
      return userData;
    } catch (error) {
      throw error;
    }
  },

  /**
   * updateUserByPhoneNumber - update user by his phone number.
   * @param phoneNumber - phoneNumber that need to check
   * @returns {Promise<void>}
   */
  updateUserByPhoneNumber: async (userData) => {
    try {
      let user = await User.findOneAndUpdate(
        { phone: userData.phone },
        { $set: userData },
        { new: true }
      );
      return user;
    } catch (error) {
      throw error;
    }
  },
  updateTempUserByPhoneNumber: async (userData) => {
    try {
      let user = await tempUser.findOneAndUpdate(
        { phone: userData.phone },
        { $set: userData },
        { new: true }
      );
      return user;
    } catch (error) {
      throw error;
    }
  },
  convertTempToUser: async (userData) => {
    try {
      let user = await User.findOneAndUpdate(
        { phone: userData.phone },
        { $set: userData },
        { new: true }
      );
      return user;
    } catch (error) {
      throw error;
    }
  },
  updateUserByUserId: async (userObj, session) => {
    try {
      let user = await User.findOneAndUpdate(
        { _id: userObj._id },
        { $set: userObj },
        { new: true, session }
      );
      return user;
    } catch (error) {
      throw error;
    }
  },
  updateUserNoSession: async (userObj) => {
    try {
      let user = await User.findOneAndUpdate(
        { _id: userObj._id },
        { $set: userObj },
        { new: true }
      );
      return user;
    } catch (error) {
      throw error;
    }
  },
  setUserLockTrue: async (userId) => {
    try {
      await User.findByIdAndUpdate(userId, { locked: true });
    } catch (error) {
      console.log("Error setting for user lock to true:", error);
      throw error;
    }
  },
  setUserLockFalse: async (userId) => {
    try {
      await User.findByIdAndUpdate(userId, { locked: false });
    } catch (error) {
      console.log("Error setting lock for user to false:", error);
      throw error;
    }
  },
  increamentNoOfChallengesUserByUserId: async (userObj) => {
    try {
      let user = await User.findOneAndUpdate(
        { _id: userObj._id },
        {
          $set: userObj,
          $inc: { noOfChallenges: 1 }, // Increment noOfChallenges by 1
        },
        { new: true }
      );
      return user;
    } catch (error) {
      throw error;
    }
  },
  findAndUpdateChallenge: async (challengeId) => {
    try {
      // Find the challenge by ID
      const challenge = await ChallengeModel.findOne({ _id: challengeId });

      if (!challenge) {
        throw new Error("Challenge not found");
      }

      // Update the challenge's state to the requested value
      challenge.state = "requested";

      // Save the updated challenge
      await challenge.save();

      return challenge;
    } catch (error) {
      // Handle any errors that occurred during the process
      console.error("Error finding and updating challenge:", error);
      throw error;
    }
  },
  findUserById: async (userId) => {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = userController;
