const axios = require("axios");
const config = require('../../helpers/config');
 // You may have other configurations here

const getUPILink = async (transactionId, amount, User) => {
  try {
    const requestData = {
      key: config.PAY_ON_UPI_SECRET,
      client_txn_id: transactionId, // Replace this with a unique transaction ID or use a library to generate it.
      amount: String(amount), // Convert amount to string
      p_info: "Buy Chips",
      customer_name: User.fullName,
      customer_email: "emigotiking@gmail.com",
      customer_mobile: User.phone,
      redirect_url: "https://test.gotiking.com/wallet",
      udf1: "user defined field 1 (max 25 char)",
      udf2: "user defined field 2 (max 25 char)",
      udf3: "user defined field 3 (max 25 char)",
    };

    const response = await axios.post(
      "https://merchant.upigateway.com/api/create_order",
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Assuming the response contains the payment URL
    const paymentUrl = response.data;

    // Redirect the user to the payment URL or use it as needed
    console.log("Payment URL:", paymentUrl);
    return paymentUrl;
  } catch (error) {
    console.error("Error while getting UPI link:", error);
    throw error;
  }
};
module.exports = getUPILink;
