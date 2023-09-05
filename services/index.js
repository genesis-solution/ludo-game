const User = require("../models/user");
async function checkUserName(userName) {
  let actualName = userName;
  if (userName) {
    userName = userName.split(" ");
    if (userName.length == 1) {
      const randomNumber = Math.floor(Math.random() * 1000);
      // add leading zero if necessary
      const formattedNumber =
        randomNumber < 10 ? `0${randomNumber}` : randomNumber;
      // concatenate first name, last name, and random number with an underscore in between
      userName = `${userName[0]}${formattedNumber}`;

      let user = await User.findOne({
        username: userName,
        otpConfirmed: true,
      });
      if (user) {
        return checkUserName(actualName);
      } else {
        return userName;
      }
    } else {
      const randomNumber = Math.floor(Math.random() * 100);
      // add leading zero if necessary
      const formattedNumber =
        randomNumber < 10 ? `0${randomNumber}` : randomNumber;
      // concatenate first name, last name, and random number with an underscore in between

      userName = `${userName[0]}_${userName[1]}${formattedNumber}`;
      let user = await User.findOne({
        username: userName,
        otpConfirmed: true,
      });
      if (user) {
        return checkUserName(actualName);
      } else {
        return userName;
      }
    }
  }
}

module.exports = checkUserName;
