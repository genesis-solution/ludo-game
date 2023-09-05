const jwt = require("jsonwebtoken");
const config = require('../helpers/config');

module.exports = async function (token) {
  if (!token) {
    throw new Error("Authorization failed");
  }

  try {
    let verified = jwt.verify(token, config.TOKEN_SECRET);
    console.log("verified", verified);
    return verified
 
  } catch (error) {
    return { error: error.message };
  }
};
