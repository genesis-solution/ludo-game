const Account = require("../models/accounts");
const Challenge = require("../models/challenges");
const challengesController = require("./challenges");
const accountController = {
  getAccountById: async (accountId) => {
    try {
      let account = await Account.findById(accountId);
      return account;
    } catch (error) {
      throw error;
    }
  },
  /**
   * insertAccount - insert account .
   * @param object - object that need to insert
   * @returns {Promise<void>}
   */
  insertAccount: async (object, session) => {
    try {
      let account = new Account(object);
      await account.save({ session });
      return account;
    } catch (error) {
      throw error;
    }
  },

  getAccountByUserId: async (userId) => {
    try {
      let account = await Account.findOne({ userId });
      return account;
    } catch (error) {
      throw error;
    }
  },

  updateAccountByUserId: async (accountObject, session) => {
    try {
      let account = await Account.findOneAndUpdate(
        { userId: accountObject.userId },
        { $set: accountObject },
        { new: true, session }
      );
      return account;
    } catch (error) {
      throw error;
    }
  },

  increaseRefererAccount: async (object, session) => {
    try {
      var referelAmount = object.amount * 0.02;

      let account = await Account.findOneAndUpdate(
        {
          userId: object.userId,
        },
        {
          $inc: {
            wallet: +referelAmount,
            referelBalance: +referelAmount,
            winningCash: +referelAmount,
          },
        },
        { new: true, session }
      );
      return account;
    } catch (error) {
      throw error;
    }
  },
  decreasePlayersAccount: async (challenge) => {
    let creatorChips = { winningCash: 0, depositCash: 0 };
    let playerChips = { winningCash: 0, depositCash: 0 };

    try {
      let playerAccount = await Account.findOne({
        userId: challenge.player._id,
      });
      let creatorAccount = await Account.findOne({
        userId: challenge.creator._id,
      });
      if (playerAccount.depositCash >= challenge.amount) {
        playerAccount.depositCash -= challenge.amount;
        playerAccount.wallet -= challenge.amount;
        playerChips.depositCash = challenge.amount;
      } else if (playerAccount.depositCash < challenge.amount) {
        const remaining = challenge.amount - playerAccount.depositCash;
        if (playerAccount.winningCash < remaining) {
          throw new Error("Insufficient balance for Player");
        } else {
          playerChips = {
            depositCash: playerAccount.depositCash,
            winningCash: remaining,
          };
          playerAccount.depositCash = 0;
          playerAccount.winningCash -= remaining;
          playerAccount.wallet -= challenge.amount;
        }
      }

      if (creatorAccount.depositCash >= challenge.amount) {
        creatorAccount.depositCash -= challenge.amount;
        creatorAccount.wallet -= challenge.amount;
        creatorChips.depositCash = challenge.amount;
      } else if (creatorAccount.depositCash < challenge.amount) {
        const remaining = challenge.amount - creatorAccount.depositCash;

        if (creatorAccount.winningCash < remaining) {
          throw new Error("Insufficient balance for creator");
        } else {
          creatorChips = {
            depositCash: creatorAccount.depositCash,
            winningCash: remaining,
          };
          creatorAccount.depositCash = 0;
          creatorAccount.winningCash -= remaining;
          creatorAccount.wallet -= challenge.amount;
        }
      }

      await Account.findOneAndUpdate(
        { userId: creatorAccount.userId },
        { $set: creatorAccount },
        { new: true }
      );

      await Account.findOneAndUpdate(
        { userId: playerAccount.userId },
        { $set: playerAccount },
        { new: true }
      );
      if (playerChips != null || creatorChips != null) {
        await challengesController.updateChallengeById({
          _id: challenge._id,
          creatorChips: creatorChips,
          playerChips: playerChips,
        });
      }

      return [playerAccount, creatorAccount];
    } catch (error) {
      console.log("decreaseplayeraccounterror", error);
      throw error;
    }
  },

  increasePlayersAccount: async (challenge) => {
    try {
      let account = await Account.updateMany(
        {
          $or: [{ userId: challenge.creator }, { userId: challenge.player }],
        },
        { $inc: { wallet: +challenge.amount, depositCash: +challenge.amount } }
      );
      return account;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = accountController;
