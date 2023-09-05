let io;
const authSocketMiddleware = require("./middleware/RSocket");
module.exports = {
  init: (server) => {
    io = require("socket.io")(server, {
      pingTimeout: 500,
      cors: {
        origin: "*",
      },
    });
    io.use((socket, next) => {
      authSocketMiddleware(socket, next);
    });

    return io;
  },
  get: () => {
    if (!io) {
      throw new Error("Socket is not initialized");
    }
    return io;
  },
};
