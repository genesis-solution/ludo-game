const dotenv = require("dotenv");
const mongoose = require("mongoose");
const TelegramBotHandler = require("./telegrambots/telegramBot");
const {
  startGame,

  bothResultNotUpdated,
  validateAmount,
} = require("./function.js");
const config = require("./helpers/config");
const accountController = require("./controllers/accounts");
const challengesController = require("./controllers/challenges");
// const { sendFCM } = require("./routes/notification");
let bot = null;
dotenv.config();
if (config.NODE_ENV === "production") {
  bot = new TelegramBotHandler(config.BOT_TOKEN);
}
function handleConnection(socket) {
  const HEARTBEAT_INTERVAL = 30000;

  socket.on("getUserWallet", async (message) => {
    try {
      const data = JSON.parse(message);

      let response = {
        status: 200,
        data: null,
        error: null,
      };

      const connections = {};
      const userId = data.payload.userId;
      connections[userId] = socket;

      switch (data.type) {
        case "getUserWallet":
          try {
            let wallet = await accountController.getAccountByUserId(
              data.payload.userId
            );

            socket.emit(
              "getUserWallet",
              JSON.stringify({
                ...response,
                status: 200,
                error: null,
                data: wallet,
              })
            );
          } catch (error) {
            response = {
              ...response,
              status: 400,
              error: error.message,
              data: null,
            };

            return socket.emit("getUserWallet", JSON.stringify(response));
          }
      }
    } catch (error) {
      let response = { status: 400, error: error, data: null };

      return socket.send(JSON.stringify(response));
    }
  });
  //todo:game
  socket.on("ludogame", async (message) => {
    try {
      const data = JSON.parse(message);

      let userId = "";
      let response = {
        status: 200,
        data: null,
        error: null,
      };
      switch (data.type) {
        case "getChallengeByChallengeId":
          try {
            let challenge = await challengesController.getChallengeById(
              data.payload.challengeId
            );
            if (challenge.player._id && challenge.creator._id) {
              if (challenge.state != "playing" && challenge.state != "hold") {
                response = {
                  ...response,
                  status: 400,
                  error: "Challenge not found",
                  data: null,
                };
                return socket.emit("ludogame", JSON.stringify(response));
              }
              if (
                challenge.creator._id == data.payload.userId ||
                challenge.player._id == data.payload.userId
              ) {
                if (challenge.player._id == data.payload.userId) {
                  await challengesController.updateChallengeById({
                    _id: challenge._id,
                    firstTime: false,
                  });
                }
                if (challenge.state == "hold") {
                  response = {
                    status: 400,
                    error: "Challenge is on hold",
                    data: null,
                  };
                  return socket.emit("ludogame", JSON.stringify(response));
                }
                if (
                  challenge.creator._id == data.payload.userId &&
                  challenge.results.creator.result !== ""
                ) {
                  response = {
                    status: 400,
                    error: "Challenge is on hold",
                    data: null,
                  };
                  return socket.emit("ludogame", JSON.stringify(response));
                }
                if (
                  challenge.player._id == data.payload.userId &&
                  challenge.results.player.result !== ""
                ) {
                  response = {
                    status: 400,
                    error: "Challenge is on hold",
                    data: null,
                  };
                  return socket.emit("ludogame", JSON.stringify(response));
                }
                response = {
                  ...response,
                  status: 200,
                  error: null,
                  data: challenge,
                };

                return socket.emit("ludogame", JSON.stringify(response));
              }
              response = {
                ...response,
                status: 400,
                error: "Not Authorized",
                data: null,
              };
              return socket.emit("ludogame", JSON.stringify(response));
            } else {
              response = {
                ...response,
                status: 400,
                error: " challenge not Foundd",
                data: null,
              };
              return socket.emit("ludogame", JSON.stringify(response));
            }
          } catch (error) {
            console.log("error.message45", error.message);
            response = {
              ...response,
              status: 400,
              error: error.message,
              data: null,
            };
            return socket.emit("ludogame", JSON.stringify(response));
          }
      }
    } catch (error) {
      console.log("Errorwa3", error.message);
      response = { ...response, status: 400, error: error, data: null };
      return socket.emit("ludogame", JSON.stringify(response));
    }
    // Parse the incoming message as JSON
  });

  //todo:play
  try {
    console.log("socket connected");
    socket.send(JSON.stringify({ type: "heartbeat" }));
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.send(JSON.stringify({ type: "heartbeat" }));
      } else {
        clearInterval(heartbeatInterval);
      }
    }, HEARTBEAT_INTERVAL);

    socket.on("message", async (message) => {
      const data = JSON.parse(message);

      let userId = "";
      let response = {
        status: 200,
        data: null,
        error: null,
      };

      switch (data.type) {
        case "create":
          return socket.send(
            JSON.stringify({
              status: 400,
              error: "site is under maintenance,we will back soon",
              data: null,
            })
          );
          break;
          const isValidAmount = validateAmount(data.payload.amount);
          if (!isValidAmount) {
            const response = {
              status: 400,
              error: "Invalid amount",
              data: null,
            };
            return socket.send(JSON.stringify(response));
          }
          let userWallet = await accountController.getAccountByUserId(
            data.payload.userId
          );
          if (userWallet.wallet - data.payload.amount < 0) {
            response = {
              ...response,
              status: 400,
              error: "You dont have enough chips",
              data: null,
            };
            return socket.send(JSON.stringify(response));
          }
          let checkChallenge = await challengesController.checkChallengeLimit(
            data.payload.userId
          );
          if (checkChallenge) {
            response = {
              ...response,
              status: 400,
              error: "You can Set Maximum 3 Challenges at Once",
              data: null,
            };
            return socket.send(JSON.stringify(response));
          }
          let sameAmountChallenge =
            await challengesController.checkSameAmountChallenge({
              userId: data.payload.userId,
              amount: data.payload.amount,
            });
          if (sameAmountChallenge.length > 0) {
            response = {
              ...response,
              status: 400,
              error: "Same Amount Challenge already exist",
              data: null,
            };

            return socket.send(JSON.stringify(response));
          }
          let checkPlayingOrHold =
            await challengesController.checkPlayingOrHold(data.payload.userId);

          if (!checkPlayingOrHold) {
            response = {
              ...response,
              status: 400,
              error: "Update Your Result In Previous Match First",
              data: null,
            };
            return socket.send(JSON.stringify(response));
          }

          let challenge = {
            creator: data.payload.userId,
            amount: data.payload.amount,
            // roomCode: roomCodeResponse.data,
            createdAt: new Date(),
          };
          challenge = await challengesController.createChallenge(challenge);
          socket.send(JSON.stringify({ status: "enabled" }));
          if (config.NODE_ENV === "production") {
            const challengeMessage = `${data.payload.username} Set a Challenge\n[Amount] - Rs. ${data.payload.amount}\n\n👇👇👇[Login Now] 👇👇👇\n👉 https://Gotiking.com/ 👈`;
            bot.sendMessageToGroup(config.TELEGRAM_GROUPID, challengeMessage);
          }

          if (!challenge) {
            response = {
              ...response,
              status: 400,
              error: "challenge not created2",
              data: null,
            };
            return socket.send(JSON.stringify(response));
          }

          break;
        case "play":
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            let currentChallenge =
              await challengesController.getOpenChallengeByChallengeId(
                data.payload.challengeId
              );

            if (!currentChallenge) {
              response = {
                ...response,
                status: 400,
                error: "Request Cancelled",
                data: null,
              };
              return socket.send(JSON.stringify(response));
            }

            let playerWallet = await accountController.getAccountByUserId(
              data.payload.userId
            );

            if (playerWallet.wallet - currentChallenge.amount < 0) {
              response = {
                ...response,
                status: 400,
                error: "You don't have enough chips",
                data: null,
              };
              return socket.send(JSON.stringify(response));
            }

            let checkRequestedChallenges =
              await challengesController.checkAlreadyRequestedGame(
                data.payload.userId
              );

            if (checkRequestedChallenges.length > 0) {
              response = {
                ...response,
                status: 400,
                error: "You have already requested a game",
                data: null,
              };
              return socket.send(JSON.stringify(response));
            }

            let checkPlayingOrHoldGame =
              await challengesController.checkPlayingOrHold(
                data.payload.userId
              );

            if (!checkPlayingOrHoldGame) {
              response = {
                ...response,
                status: 400,
                error: "Update Your Result In Previous Match First",
                data: null,
              };
              return socket.send(JSON.stringify(response));
            }

            currentChallenge = await challengesController.updateChallengeById44(
              currentChallenge._id,
              data.payload.userId,
              session
            );

            await session.commitTransaction();
            session.endSession();

            let challenges = await challengesController.getAllChallenges();
            socket.send(JSON.stringify(challenges));

            if (!currentChallenge) {
              response = {
                ...response,
                status: 400,
                error: "Challenge not created",
                data: null,
              };
              return socket.send(JSON.stringify(response));
            }

            socket.send(JSON.stringify({ status: "enabled" }));
          } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
          }

          break;
        case "cancel":
          await challengesController.updateChallengeById23(
            data.payload.challengeId
          );
          socket.send(JSON.stringify({ status: "enabled" }));

          break;
        case "delete":
          await challengesController.updateDeleteChallengeById(
            data.payload.challengeId
          );

          socket.send(JSON.stringify({ status: "enabled" }));

          break;

        case "deleteOpenChallengesOfCreator":
          await challengesController.deleteOpenChallenges(data.payload.userId);

          break;
        case "startGame":
          await startGame(data, socket);
          socket.send(JSON.stringify({ status: "enabled" }));

          await bothResultNotUpdated(data.payload.challengeId);
          break;
      }

      let challenges = await challengesController.getAllChallenges();

      socket.send(JSON.stringify(challenges));
    });
    socket.on("close", (code, reason) => {
      console.log("WebSocket connection Closed:", code, reason);
      clearInterval(heartbeatInterval);
    });
  } catch (error) {
    console.log("error", error);
  }
}
module.exports = handleConnection;
