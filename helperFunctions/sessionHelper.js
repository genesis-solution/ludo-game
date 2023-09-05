// sessionHelper.js

const { client } = require("../allSocketConnection");
const socket = require("../socket");

async function removeUserSession(userId, sessionId) {
  try {
    await this.removeActiveUserSession(userId);
    await client.set("userId:" + userId, sessionId);
  } catch (error) {
    console.error("Error removing user sessions:", error);
  }
}

async function removeActiveUserSession(userId) {
  const io = socket.get();
  const prev_session = await client.get("userId:" + userId);

  if (prev_session) {
    var activeSockets = await client.get(userId);

    if (activeSockets) {
      activeSockets = JSON.parse(activeSockets);

      activeSockets.map( async (activeSocket) => {
        var previousSocket = await io.sockets.sockets.get(activeSocket);

        if (previousSocket) {
          // Logout event
          previousSocket.emit("logout", {});
          previousSocket.disconnect(true);
        }
      })
    }
  }

  await client.del(userId);
  await client.del("sess:" + prev_session);
  await client.del("userId:" + userId);
}

module.exports = {
  removeUserSession,
  removeActiveUserSession,
};
