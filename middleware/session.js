const { responseHandler } = require("../helpers");
const sessionAuthMiddleware = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return responseHandler(
      res,
      400,
      null,
      "Session Expired! Please Refresh & Login Again"
    );
  }
};
module.exports = sessionAuthMiddleware;
