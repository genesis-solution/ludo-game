const fs = require("fs");
const responseHandler = async (res, status, data, error) => {
  try {
    return res.status(status).send({
      status,
      data,
      error,
    });
  } catch (error) {
    throw error;
  }
};

const generateReferCode = () => {
  const min = 1000000000; // Minimum 10-digit number (inclusive)
  const max = 9999999999; // Maximum 10-digit number (inclusive)

  const referCode = Math.floor(
    Math.random() * (max - min + 1) + min
  ).toString();
  console.log("referCode: " + referCode);
  return referCode;
};

const generate = (n) => {
  if (n <= 0) {
    throw new Error("n must be a positive integer");
  }

  const min = Math.pow(10, n - 1);
  const max = Math.pow(10, n) - 1;

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = {
  responseHandler,
  generate,
  generateReferCode,
  randomIntFromInterval,
};
