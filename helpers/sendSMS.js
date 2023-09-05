const fetch = require("node-fetch");
const config = require("../helpers/config");
const apiKey = config.SMS_KEY;
const url = "https://www.fast2sms.com/dev/bulkV2";
const sendText = async (text, phoneNumber) => {
  const data = {
    variables_values: text,
    route: "otp",
    numbers: +phoneNumber,
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: apiKey,
    },
    body: JSON.stringify(data),
  };
  let response = null;
  if (config.NODE_ENV === "production") {
    response = await fetch(url, options);
    const json = await response.json();
    return json;
  } else {
    return (response = { return: true });
  }
};

module.exports = sendText;
