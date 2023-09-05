const ChallengeModel = require("../models/challenges");
const User = require("../models/user");
const Account = require("../models/accounts");
const mongoose = require("mongoose");
const indian_names = require("../commonImports/indian_names");
const axios = require("axios");
const History = require("../models/history");
const TransactionsModel = require("../models/transactions");

const moment = require("moment");
const tempUser = require("../models/tempUser");
const {
  calculateChips,
  generateHistory,
} = require("../helperFunctions/helper");
const updateAccountAndChips = async (account, chips, session) => {
  if (chips) {
    await Account.findOneAndUpdate(
      { userId: account.userId },
      { $set: account },
      { new: true, session }
    );
  }
};
const challengesController = {
  /**
   * createChallenge - challengeObject that need to be insert.
   * @param challengeObject - challengeObject that need to insert
   * @returns {Promise<void>}
   */
  createChallenge: async (challengeObject) => {
    try {
      let challenge = new ChallengeModel(challengeObject);
      await challenge.save();
      return challenge;
    } catch (error) {
      throw error;
    }
  },
  /**
   * getAllChallenges - to get all challenges
   * @returns {Promise<void>}
   */
  cancelRequestedChallengesByPlayerId: async (playerId) => {
    try {
      let challenge = await ChallengeModel.updateMany(
        { player: playerId, state: "requested" },
        { $set: { state: "open", player: null } },
        { new: true }
      );
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },

  /**
     * 
     * 

            /**

 * @returns {Promise<void>}
 */
  startGameChallenge: async (challengeId, socket, userID) => {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      let updatedChallenge = await ChallengeModel.findOneAndUpdate(
        { _id: challengeId, state: "requested" },
        { $set: { state: "playing" } },
        { new: true, session }
      );
      if (updatedChallenge) {
        await User.findOneAndUpdate(
          { _id: updatedChallenge.creator._id },
          { $set: { noOfChallenges: 1 } },
          { new: true }
        );
        await User.findOneAndUpdate(
          { _id: updatedChallenge.player._id },
          { $set: { noOfChallenges: 1 } },
          { new: true }
        );
        await ChallengeModel.deleteMany(
          {
            creator: updatedChallenge.creator._id,
            state: { $in: ["open", "requested"] },
          },
          { session }
        );
        await ChallengeModel.deleteMany(
          {
            creator: updatedChallenge.player._id,
            state: { $in: ["open", "requested"] },
          },

          { session }
        );
        await ChallengeModel.updateMany(
          { player: updatedChallenge.creator._id, state: "requested" },
          { $set: { state: "open", player: null } },
          { new: true, session }
        );
        await ChallengeModel.updateMany(
          { player: updatedChallenge.player._id, state: "requested" },
          { $set: { state: "open", player: null } },
          { new: true, session }
        );
        let creatorChips = { winningCash: 0, depositCash: 0 };
        let playerChips = { winningCash: 0, depositCash: 0 };
        var config = {
          method: "get",
          url: "  http://128.199.28.12:3000/ludoking/roomcode",
          headers: {},
        };
        let roomCodeResponse = await axios(config);
        const roomCode = roomCodeResponse.data;
        updatedChallenge = await ChallengeModel.findOneAndUpdate(
          { _id: challengeId, state: "playing" },
          { $set: { roomCode: roomCode } },
          { new: true, session }
        ).populate("creator player", "username");

        let playerAccount = await Account.findOne({
          userId: updatedChallenge.player._id,
        });
        let creatorAccount = await Account.findOne({
          userId: updatedChallenge.creator._id,
        });
        if (playerAccount.depositCash >= updatedChallenge.amount) {
          playerAccount.depositCash -= updatedChallenge.amount;
          playerAccount.wallet -= updatedChallenge.amount;
          playerChips.depositCash = updatedChallenge.amount;
        } else if (playerAccount.depositCash < updatedChallenge.amount) {
          const remaining = updatedChallenge.amount - playerAccount.depositCash;
          if (playerAccount.winningCash < remaining) {
            throw new Error("Insufficient balance for Player");
          } else {
            playerChips = {
              depositCash: playerAccount.depositCash,
              winningCash: remaining,
            };
            playerAccount.depositCash = 0;
            playerAccount.winningCash -= remaining;
            playerAccount.wallet -= updatedChallenge.amount;
          }
        }

        if (creatorAccount.depositCash >= updatedChallenge.amount) {
          creatorAccount.depositCash -= updatedChallenge.amount;
          creatorAccount.wallet -= updatedChallenge.amount;
          creatorChips.depositCash = updatedChallenge.amount;
        } else if (creatorAccount.depositCash < updatedChallenge.amount) {
          const remaining =
            updatedChallenge.amount - creatorAccount.depositCash;

          if (creatorAccount.winningCash < remaining) {
            throw new Error("Insufficient balance for creator");
          } else {
            creatorChips = {
              depositCash: creatorAccount.depositCash,
              winningCash: remaining,
            };
            creatorAccount.depositCash = 0;
            creatorAccount.winningCash -= remaining;
            creatorAccount.wallet -= updatedChallenge.amount;
          }
        }
        let winner =
          userID == updatedChallenge.creator._id ? "creator" : "player";
        let looser =
          userID != updatedChallenge.creator._id ? "creator" : "player";

        const creatorBalance = await Account.findOneAndUpdate(
          { userId: creatorAccount.userId },
          { $set: creatorAccount },
          { new: true, session }
        );
        const creatorHistory = {
          userId: creatorBalance.userId,
          historyText: `Started Game with ${updatedChallenge[looser].username}`,
          roomCode: updatedChallenge.roomCode,
          closingBalance: creatorBalance.wallet,
          amount: Number(updatedChallenge.amount),
          type: "Game",
        };
        await generateHistory(creatorHistory, session);

        const playerBalance = await Account.findOneAndUpdate(
          { userId: playerAccount.userId },
          { $set: playerAccount },
          { new: true, session }
        );
        const historyObj = {
          userId: playerBalance.userId,
          historyText: `Started Game with ${updatedChallenge[winner].username}`,
          roomCode: updatedChallenge.roomCode,
          closingBalance: playerBalance.wallet,
          amount: Number(updatedChallenge.amount),
          type: "Game",
        };

        await generateHistory(historyObj, session);
        if (playerChips != null || creatorChips != null) {
          await challengesController.updateChallengeById(
            {
              _id: updatedChallenge._id,
              creatorChips: creatorChips,
              playerChips: playerChips,
            },
            session
          );
        }
      }
      await session.commitTransaction();
      return updatedChallenge;
    } catch (error) {
      await session.abortTransaction();
      console.log("error2323", error);
      throw error;
    } finally {
      socket.send(JSON.stringify({ status: "enabled" }));
      session.endSession();
    }
  },

  /**
   *
   *                 /**
   * deleteRequestedChallenges - to get all challenges
   * @returns {Promise<void>}
   */

  deleteOpenChallenges: async (creatorId) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      let challenge = await ChallengeModel.deleteMany(
        {
          creator: creatorId,
          state: { $in: ["open", "requested"] },
        },
        { session }
      );
      await ChallengeModel.updateMany(
        { player: creatorId, state: "requested" },
        { $set: { state: "open", player: null } },
        { new: true, session }
      );
      await session.commitTransaction();
      return challenge;
    } catch (error) {
      await session.abortTransaction();
      console.log("error", error);
      throw error;
    } finally {
      session.endSession();
    }
  },
  cancelRequestedChallenges2: async (creatorId) => {
    try {
      let challenge = await ChallengeModel.updateMany(
        { creator: creatorId, state: "requested" },
        { $set: { state: "open", player: null } },
        { new: true }
      );
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },

  /**
   * getAllChallenges - to get all challenges
   * @returns {Promise<void>}
   */
  getAllChallenges: async (challengeObject) => {
    try {
      let challenge = await ChallengeModel.find({
        state: { $nin: ["resolved"] },
      }).populate("creator player", "username profileImage");
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  purgeDatabase: async (challengeObject) => {
    try {
      await ChallengeModel.deleteMany();
      await User.deleteMany();
      await Account.deleteMany();
      await tempUser.deleteMany();
      await TransactionsModel.deleteMany();
      await History.deleteMany();
      console.log("database deleted");
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  UpdateOpenChallenges: async () => {
    try {
      const challenges = await ChallengeModel.find({
        state: "open",
        fake: false,
      });
      challenges;

      let updatedCount = 0;
      if (challenges.length > 0) {
        // Iterate through the challenges
        for (const challenge of challenges) {
          const createdAt = moment(challenge.createdAt);

          const minutesPassed = moment().diff(createdAt, "minutes");

          if (minutesPassed > 1) {
            // Challenge was created more than 3 minutes ago, perform update
            await ChallengeModel.findOneAndDelete({
              _id: challenge._id,
              state: "open",
            });
            updatedCount++;
          }
        }
        console.log(`Updated ${updatedCount} challenges.`);
      }
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },

  /**
   * updateChallengeById - updateChallengeById
   * @returns {Promise<void>}
   */
  updateChallengeById: async (challengeObj, session) => {
    try {
      let challenge = await ChallengeModel.findOneAndUpdate(
        { _id: challengeObj._id },
        { $set: challengeObj },
        { new: true, session }
      );
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  updatePlayingChallenge: async (challengeObj) => {
    try {
      let challenge = await ChallengeModel.findOneAndUpdate(
        { _id: challengeObj._id },
        { $set: challengeObj },
        { new: true }
      );
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  createFakeChallenges: async () => {
    const getRandomNumber = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const getRandomMultipleOf50 = (min, max) => {
      const randomNum =
        getRandomNumber(Math.ceil(min / 50), Math.floor(max / 50)) * 50;
      return randomNum <= max ? randomNum : getRandomMultipleOf50(min, max);
    };

    try {
      const numberOfChallenges = 50;

      // Fetch all fake user IDs from the User model
      const fakeUserIds = await User.find({ fake: true }).select("_id");

      const fakeChallenges = Array.from({ length: numberOfChallenges }, () => {
        let randomCreatorIndex;
        let randomPlayerIndex;

        // Ensure the creator and player are different users
        do {
          randomCreatorIndex = getRandomNumber(0, fakeUserIds.length - 1);
          randomPlayerIndex = getRandomNumber(0, fakeUserIds.length - 1);
        } while (randomPlayerIndex === randomCreatorIndex);

        return {
          creator: fakeUserIds[randomCreatorIndex]._id, // Random creator ID from fake user IDs
          player: fakeUserIds[randomPlayerIndex]._id, // Random player ID from fake user IDs
          amount: getRandomMultipleOf50(50, 10000), // Random amount between 100 and 500
          state: "playing", // Set state to "playing"
          fake: true,
        };
      });

      await ChallengeModel.insertMany(fakeChallenges);
      console.log("Fake challenges created successfully!");
    } catch (error) {
      console.error("Error creating fake challenges:", error);
      throw error;
    }
  },

  createFakeUsers: async () => {
    const getRandomNumber = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    // Function to generate a random username
    const generateRandomUsername = () => {
      const adjective =
        indian_names[getRandomNumber(0, indian_names.length - 1)];

      return `${adjective}_${getRandomNumber(1000, 9999)}`;
    };

    // Function to generate a random profile image from "1.svg" to "10.svg"
    const generateRandomProfileImage = () => {
      const profileImageNumber = getRandomNumber(1, 10);
      return `${profileImageNumber}.svg`;
    };
    try {
      const numberOfUsers = 100;
      const fakeUsers = Array.from({ length: numberOfUsers }, () => {
        const fullName = "fakername";
        const username = generateRandomUsername(); // Generate a random username
        const profileImage = generateRandomProfileImage(); // Random profile image "1.svg" to "10.svg"

        return {
          username,
          fullName,
          profileImage,
          fake: true, // Set fake to true
        };
      });

      await User.insertMany(fakeUsers);
      console.log("Fake users with Indian names created successfully!");
    } catch (error) {
      console.error("Error creating fake users:", error);
      throw error;
    }
  },

  updateDeleteChallengeById: async (challengeId) => {
    await ChallengeModel.findOneAndDelete({
      _id: challengeId,
      state: "open",
    });
  },

  updateChallengeById44: async (challengeId, playerId, session) => {
    try {
      let challenge = await ChallengeModel.findOneAndUpdate(
        { _id: challengeId, state: "open" },
        { $set: { state: "requested", player: playerId } },
        { new: true, session }
      );
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },

  updateChallengeById22: async (challengeId) => {
    try {
      let player = await User.findOne({
        _id: challengeId.player._id,
        isBlocked: false,
        otpConfirmed: true,
      });
      let creator = await User.findOne({
        _id: challengeId.creator._id,
        isBlocked: false,
        otpConfirmed: true,
      });
      console.log("checkkknoof", player.noOfChallenges, creator.noOfChallenges);
      let challenge = await ChallengeModel.findById(challengeId._id);
      if (player.noOfChallenges === 0 && creator.noOfChallenges === 0) {
        if (!challenge) {
          throw new Error("Challenge not found");
        }

        if (challenge.state === "requested") {
          challenge.state = "playing";
          challenge.startedAt = new Date();
          await challenge.save();
        } else {
          console.log("Invalid state for updating challenge22");
          return false;
        }
      }

      return challenge;
    } catch (error) {
      console.log("error23", error);
    }
  },

  updateChallengeById23: async (challengeId) => {
    try {
      let challenge = await ChallengeModel.findOneAndUpdate(
        { _id: challengeId, state: "requested" },
        { $set: { player: null, state: "open" } },
        { new: true }
      );
      return challenge;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteChallengeById: async (challengeId) => {
    try {
      let challenge = await ChallengeModel.findOneAndDelete({
        _id: challengeId,
      });
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },

  /**
   * getChallengeByChallengeId - to get  challenge by challenge id
   * @returns {Promise<void>}
   */
  getChallengeByChallengeId: async (challengeId) => {
    try {
      let challenge = await ChallengeModel.findById(challengeId).populate(
        "creator",
        "username"
      );
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  getOpenChallengeByChallengeId: async (challengeId) => {
    try {
      let challenge = await ChallengeModel.findById({
        _id: challengeId,
        state: "open",
      }).populate("creator", "username");
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  // setLockTrue: async (challengeId) => {
  //   try {
  //     const challenge = await ChallengeModel.findById(challengeId);

  //     if (challenge.locked) {
  //       return false;
  //     }

  //     challenge.locked = true;
  //     await challenge.save();
  //     return true;
  //   } catch (error) {
  //     console.log("Error setting lock to true:", error);
  //     throw error;
  //   }
  // },

  // setLockFalse: async (challengeId) => {
  //   try {
  //     await ChallengeModel.findByIdAndUpdate(challengeId, { locked: false });
  //   } catch (error) {
  //     console.log("Error setting lock to false:", error);
  //     throw error;
  //   }
  // },

  /**
   * getChallengeById - to get  challenge by challenge id
   * @returns {Promise<void>}
   */
  getChallengeById: async (challengeId) => {
    try {
      let challenge = await ChallengeModel.findById(challengeId).populate(
        "creator player",
        "username"
      );
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  getPlayingChallengeById: async (challengeId) => {
    try {
      let challenge = await ChallengeModel.findOne({
        _id: challengeId,
        state: "playing",
      }).populate("creator player", "username");
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  getChallengeById12: async (challengeId) => {
    try {
      let challenge = await ChallengeModel.findOne({
        _id: challengeId,
        state: "playing",
      }).populate("creator player", "username");
      return challenge;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  updateChallengeStateToHold: async (challengeId) => {
    try {
      // Find the challenge by ID
      const challenge = await ChallengeModel.findById(challengeId);

      if (!challenge) {
        console.log("Challenge not found");
        return;
      }

      // Update the challenge state to "hold"
      challenge.state = "hold";
      await challenge.save();

      console.log("Challenge state updated to hold");
    } catch (error) {
      console.error("Error updating challenge state:", error);
    }
  },

  /**
   * checkChallengeLimit - userId that need to be check.
   * @param userId - userId that need to check
   * @returns {Promise<void>}
   */
  checkChallengeLimit: async (userId) => {
    try {
      if (
        (await ChallengeModel.find({
          creator: userId,
          state: { $in: ["open", "requested"] },
        }).countDocuments()) === 3
      ) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * checkSameAmountChallenge - userId that need to be check.
   * @param userId - data that need to check
   * @returns {Promise<void>}
   */
  checkSameAmountChallenge: async (data) => {
    try {
      let challenge = await ChallengeModel.find({
        creator: data.userId,
        amount: data.amount,

        state: { $in: ["open", "requested"] },
      });
      return challenge;
    } catch (error) {
      throw error;
    }
  },

  /**
   * checkPlayingOrHold - challenge that need to be checked.
   * @param userId - userId that need to check
   * @returns {Promise<void>}
   */
  checkPlayingOrHold: async (userId) => {
    try {
      const { noOfChallenges } = await User.findById(userId);
      console.log("nooffchallenges", noOfChallenges);
      if (noOfChallenges > 0) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      throw error;
    }
  },
  /**
   * checkPlayingOrHold - challenge that need to be checked.
   * @param userId - userId that need to check
   * @returns {Promise<void>}
   */
  checkOpenOrRequested: async (userId) => {
    try {
      let challenge = await ChallengeModel.find({
        $or: [{ creator: userId }, { player: userId }],
        state: { $in: ["open", "requested"] },
      });
      return challenge;
    } catch (error) {
      throw error;
    }
  },

  /**
   * checkIfUserIsCreator - challenge that need to be checked.
   * @param userId - userId that need to check
   * @returns {Promise<void>}
   */
  checkIfUserIsCreator: async (userId, challengeId) => {
    try {
      let challenge = await ChallengeModel.find({
        _id: challengeId,
        creator: userId,
      });
      return challenge;
    } catch (error) {
      throw error;
    }
  },

  /**
   * checkAlreadyRequestedGame - check if user has already requested a game
   * @param userId - userId that need to check
   * @returns {Promise<void>}
   */
  checkAlreadyRequestedGame: async (userId) => {
    try {
      let challenge = await ChallengeModel.find({
        player: userId,
        state: "requested",
      });
      return challenge;
    } catch (error) {
      throw error;
    }
  },

  //     /**
  // * checkRequestedChallenge - challenge that need to be checked.
  // * @param userId - userId that need to check
  // * @returns {Promise<void>}
  // */
  // checkRequestedChallenge: async (userId, challengeId) => {
  //         try {
  //             let challenge = await ChallengeModel.find({ _id: challengeId, creator: userId })
  //             return challenge
  //         } catch (error) {
  //             throw error
  //         }
  //     },
};

module.exports = challengesController;
