const express = require("express");
const mongoose = require("mongoose");
const accountController = require("../controllers/accounts");
const challengesController = require("../controllers/challenges");
const { responseHandler } = require("../helpers");
const verifyToken = require("../middleware/verifyToken");

const Router = express.Router();

const { handleChallengeCancellation } = require("../function");
const History = require("../models/history");

const { handleChallengeUpdate } = require("../function");
const axios = require("axios");
// const { MongoClient } = mongodb;
const userController = require("../controllers/user");
const { generateHistory } = require("../helperFunctions/helper");

Router.get(
  "/getChallengeByChallengeId/:challengeId",
  verifyToken,
  async (req, res) => {
    try {
      if (!req.params.hasOwnProperty("challengeId")) {
        return responseHandler(res, 400, null, "Fields are missing");
      }
      let user = req.user;
      let challenge = await challengesController.getChallengeById(
        req.params.challengeId
      );
      if (!challenge) {
        return responseHandler(res, 400, null, "Challenge not found");
      } else {
        if (
          (challenge.creator._id.toString() == user.id.toString() ||
            challenge.player._id.toString() == user.id.toString()) &&
          challenge.state == "started"
        ) {
          return responseHandler(res, 200, challenge, null);
        } else {
          responseHandler(res, 400, null, "Challenge not found");
        }
      }
    } catch (error) {}
  }
);

Router.post("/win/:id", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (!req.params.hasOwnProperty("id")) {
      return responseHandler(res, 400, null, "Fields are missing");
    }
    if (!req.body.hasOwnProperty("image")) {
      return responseHandler(res, 400, null, "Fields are missing");
    } else {
      let challenge = await challengesController.getPlayingChallengeById(
        req.params.id
      );
      if (!challenge) {
        return responseHandler(res, 400, null, "result already updated");
      }
      let user = req.user;
      let winner = user.id == challenge.creator._id ? "creator" : "player";
      let looser = user.id != challenge.creator._id ? "creator" : "player";
      if (challenge.results[winner].result !== "") {
        return responseHandler(
          res,
          400,
          null,
          `${winner} result already updatedd`
        );
      }
      let amount = Number(challenge.amount);
      let userWallet = await accountController.getAccountByUserId(user.id);
      console.log("winner---------");
      const image = req.body.image;

      let file = image;

      if (challenge.results[winner !== ""]) {
        return responseHandler(
          res,
          400,
          null,
          "You have already submitted the result"
        );
      }
      const { roomCode } = challenge;
      let apiResult = null;
      if (!challenge.apiResult) {
        axios
          .get(`http://128.199.28.12:3000/ludoking/results/${roomCode}`)
          .then((response) => {
            const data = response.data;
            apiResult = data;
          })
          .catch((error) => {
            // Handle the error case
            console.error(error);
          });
      }
      // console.log("testtt", response);

      let challengeObj = {
        ...challenge._doc,
        results: {
          [winner]: { result: "win", updatedAt: new Date() },
          [looser]: {
            result: challenge.results[looser].result,
            updatedAt: challenge.results[looser].updatedAt,
          },
        },
        winnerScreenShot: {
          [winner]: file,
          [looser]: challenge.winnerScreenShot[looser],
        },
      };
      if (apiResult !== null) {
        challengeObj.apiResult = apiResult;
      }

      if (challenge.results[looser].result == "win") {
        challengeObj.state = "hold";
      }
      //win and no update
      let data = {
        challengeId: req.params.id,
        userId: challenge[looser]._id,
        otherPlayer: looser,
      };
      if (challenge.results[looser].result == "") {
        await handleChallengeUpdate(data);
        // io.emit(
        //   "showTimer",
        //   JSON.stringify({
        //     showTimer: true,
        //     challengeId: req.params.id,
        //     userId: req.user,
        //   })
        // );
      }
      if (challenge.results[looser].result == "lost") {
        challengeObj.state = "resolved";
        let deduction = challenge.amount * 0.03;
        amount = amount * 2 - (amount * 3) / 100;

        const winnWall = await accountController.updateAccountByUserId(
          {
            ...userWallet._doc,
            wallet: userWallet.wallet + amount,
            winningCash: userWallet.winningCash + amount,
            totalWin: userWallet.totalWin + challenge.amount - deduction,
          },
          session
        );
        let looserWallet23 = await accountController.getAccountByUserId(
          challenge[looser]._id
        );
        const historyObj = {
          userId: challenge[looser]._id,
          historyText: `Lost Against ${challenge[winner].username}`,
          roomCode: challenge.roomCode,
          closingBalance: looserWallet23.wallet,
          amount: Number(challenge.amount),
          type: "lost",
        };
        await generateHistory(historyObj, session);

        const winnerObj = {
          userId: challenge[winner]._id,
          historyText: `Won Against ${challenge[looser].username}`,
          roomCode: challenge.roomCode,
          closingBalance: winnWall.wallet,
          amount: Number(amount),
          type: "won",
        };
        await generateHistory(winnerObj, session);

        let referUser = await userController.existingUserById({
          id: challenge[winner]._id,
        });

        if (referUser.referer) {
          let referalAccount = await userController.existingUserByReferelId(
            referUser.referer
          );

          const userWall = await accountController.increaseRefererAccount(
            {
              userId: referalAccount._id,
              amount: challenge.amount,
            },
            session
          );

          const historyObj = {
            userId: userWall.userId,
            historyText: `referal from ${challenge[winner].username}`,
            roomCode: challenge.roomCode,
            closingBalance: userWall.wallet,
            amount: Number(challenge.amount * 0.02),
            type: "referal",
          };
          await generateHistory(historyObj, session);
        }
      }
      if (challenge.results[looser].result == "cancelled") {
        challengeObj.state = "hold";
      }
      await userController.updateUserByUserId(
        {
          _id: user.id,
          noOfChallenges: 0,
        },
        session
      );
      challenge = await challengesController.updateChallengeById(
        challengeObj,
        session
      );
      await session.commitTransaction();
      session.endSession();

      return responseHandler(res, 200, challenge, null);
    }
  } catch (error) {
    await session.abortTransaction();

    console.log("error", error);
    return responseHandler(res, 400, null, error.message);
  } finally {
    session.endSession();
  }
});

Router.post("/loose/:id", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!req.params.hasOwnProperty("id")) {
      return responseHandler(res, 400, null, "Fields are missing");
    } else {
      let challenge = await challengesController.getPlayingChallengeById(
        req.params.id
      );
      if (!challenge) {
        return responseHandler(res, 400, null, "result already updated");
      }
      let user = req.user;
      let looser = user.id == challenge.creator._id ? "creator" : "player";
      let winner = user.id != challenge.creator._id ? "creator" : "player";

      if (challenge.results[looser].result !== "") {
        return responseHandler(res, 400, null, "result already updatedd");
      }

      if (challenge.results[looser].result !== "") {
        return responseHandler(
          res,
          400,
          null,
          "You have already submitted the result"
        );
      }
      let winnerUserId = challenge[winner]._id;
      let looserUserId = challenge[looser]._id;
      let amount = Number(challenge.amount);
      let deductedAmount = amount;
      let deduction = 0;
      let userWallet = await accountController.getAccountByUserId(winnerUserId);
      let looserWallet = await accountController.getAccountByUserId(
        looserUserId
      );

      amount = amount * 2 - (amount * 3) / 100;
      const { roomCode } = challenge;
      let apiResult = null;
      if (!challenge.apiResult) {
        axios
          .get(`http://128.199.28.12:3000/ludoking/results/${roomCode}`)
          .then((response) => {
            const data = response.data;
            apiResult = data;
          })
          .catch((error) => {
            // Handle the error case
            console.error(error);
          });
      }
      let challengeObj = {
        ...challenge._doc,
        //first who sent i lost his result will be saved lost
        results: {
          [looser]: { result: "lost", updatedAt: new Date() },

          [winner]: {
            result: challenge.results[winner].result,
            updatedAt: challenge.results[winner].updatedAt,
          },
        },
      };
      if (apiResult !== null) {
        challengeObj.apiResult = apiResult;
      }
      let data = {
        challengeId: req.params.id,
        userId: challenge[winner]._id,
        otherPlayer: winner,
      };
      //if 2nd user result is empty
      if (challenge.results[winner].result == "") {
        handleChallengeUpdate(data);
        // io.emit(
        //   "showTimer",
        //   JSON.stringify({
        //     showTimer: true,
        //     challengeId: req.params.id,
        //     userId: req.user,
        //   })
        // );
      }
      if (challenge.results[winner].result == "lost") {
        await handleChallengeCancellation(
          challengeObj,
          challenge,
          looser,
          winner,
          looserWallet,
          userWallet,
          session
        );
      }

      if (challenge.results[winner].result == "win") {
        let deduction = challenge.amount * 0.03;
        let wall = {
          ...userWallet._doc,
          wallet: userWallet.wallet + amount,
          winningCash: userWallet.winningCash + amount,
          totalWin: userWallet.totalWin + challenge.amount - deduction,
        };

        // challengeObj.state = "resolved"
        challengeObj.state = "resolved";

        const historyObj = {
          userId: challenge[looser]._id,
          historyText: `Lost Against ${challenge[winner].username}`,
          roomCode: challenge.roomCode,
          closingBalance: looserWallet.wallet,
          amount: Number(amount),
          type: "lost",
        };
        await generateHistory(historyObj, session);

        const winnerObj = {
          userId: challenge[winner]._id,
          historyText: `Won Against ${challenge[looser].username}`,
          roomCode: challenge.roomCode,
          closingBalance: wall.wallet,
          amount: Number(challenge.amount * 2 - (challenge.amount * 3) / 100),
          type: "won",
        };
        await generateHistory(winnerObj, session);

        await accountController.updateAccountByUserId(wall, session);

        let referUser = await userController.existingUserById({
          id: challenge[winner]._id,
        });

        if (referUser.referer) {
          let referalAccount = await userController.existingUserByReferelId(
            referUser.referer
          );

          const updatedReferAccount =
            await accountController.increaseRefererAccount(
              {
                userId: referalAccount._id,
                amount: challenge.amount,
              },
              session
            );

          const historyObj = {
            userId: updatedReferAccount.userId,
            historyText: `referal from ${challenge[winner].username}`,
            roomCode: challenge.roomCode,
            closingBalance: updatedReferAccount.wallet,
            amount: Number(challenge.amount * 0.02),
            type: "referal",
          };
          await generateHistory(historyObj, session);
        }
      }
      if (challenge.results[winner].result == "cancelled") {
        challengeObj.state = "hold";
      }
      await userController.updateUserByUserId(
        {
          _id: user.id,
          noOfChallenges: 0,
        },
        session
      );
      challenge = await challengesController.updateChallengeById(
        challengeObj,
        session
      );
      await session.commitTransaction();
      session.endSession();

      return responseHandler(res, 200, challenge, null);
    }
  } catch (error) {
    await session.abortTransaction();

    console.log("error", error);
    return responseHandler(res, 400, null, error.message);
  } finally {
    session.endSession();
  }
});

Router.post("/cancel/:id", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    if (!req.params.hasOwnProperty("id")) {
      return responseHandler(res, 400, null, "Fields are missing");
    }
    if (!req.body.hasOwnProperty("cancellationReason")) {
      return responseHandler(res, 400, null, "Fields are missing");
    } else {
      let challenge = await challengesController.getPlayingChallengeById(
        req.params.id
      );
      if (!challenge) {
        return responseHandler(res, 400, null, "result already updated");
      }
      let user = req.user;
      let canceller = user.id == challenge.creator._id ? "creator" : "player";
      let otherPlayer = user.id != challenge.creator._id ? "creator" : "player";

      if (challenge.results[canceller].result !== "") {
        return responseHandler(res, 400, null, "result already updatedd");
      }

      let cancellerWallet = await accountController.getAccountByUserId(
        challenge[canceller]._id
      );
      let otherPlayerWallet = await accountController.getAccountByUserId(
        challenge[otherPlayer]._id
      );
      const { roomCode } = challenge;
      let apiResult = null;
      if (!challenge.apiResult) {
        await axios
          .get(`http://128.199.28.12:3000/ludoking/results/${roomCode}`)
          .then((response) => {
            const data = response.data;
            apiResult = data;
          })
          .catch((error) => {
            // Handle the error case
            console.error(error);
          });
      }

      let challengeObj = {
        ...challenge._doc,
        results: {
          [canceller]: { result: "cancelled", updatedAt: new Date() },

          [otherPlayer]: {
            result: challenge.results[otherPlayer].result,
            updatedAt: challenge.results[otherPlayer].updatedAt,
          },
        },

        cancellationReasons: { [canceller]: req.body.cancellationReason },
      };
      if (apiResult !== null) {
        challengeObj.apiResult = apiResult;
      }
      let data = {
        challengeId: req.params.id,
        userId: challenge[otherPlayer]._id,
        otherPlayer: otherPlayer,
      };

      if (challenge.results[otherPlayer].result == "") {
        handleChallengeUpdate(data);
        // io.emit(
        //   "showTimer",
        //   JSON.stringify({
        //     showTimer: true,
        //     challengeId: req.params.id,
        //     userId: req.user,
        //   })
        // );
      }
      if (challenge.results[otherPlayer].result == "lost") {
        challengeObj.state = "hold";
      }
      if (challenge.results[otherPlayer].result == "win") {
        challengeObj.state = "hold";
      }
      if (challenge.results[otherPlayer].result == "cancelled") {
        await handleChallengeCancellation(
          challengeObj,
          challenge,
          canceller,
          otherPlayer,
          cancellerWallet,
          otherPlayerWallet,
          session
        );
      }

      await userController.updateUserByUserId(
        {
          _id: user.id,
          noOfChallenges: 0,
        },
        session
      );
      challenge = await challengesController.updateChallengeById(
        challengeObj,
        session
      );
      await session.commitTransaction();

      return responseHandler(res, 200, challenge, null);
    }
  } catch (error) {
    await session.abortTransaction();

    console.log("error", error);
    return responseHandler(res, 400, null, error.message);
  } finally {
    session.endSession();
  }
});

module.exports = Router;
