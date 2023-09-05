const TransactionsModel = require("../models/transactions");

const transactionsController = {
  /**
   * insertNewTransaction - transactionObj that need to be insert.
   * @param transactionObj - transactionObj that need to insert
   * @returns {Promise<void>}
   */
  insertNewTransaction: async (transactionObj, session) => {
    try {
      let response = new TransactionsModel(transactionObj);
      response = await response.save({ session });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * existingTransactionsByUserId - Check existing transaction by user id.
   * @param userId - user that need to check
   * @returns {Promise<void>}
   */
  existingTransactionsByUserId: async (userId, value) => {
    try {
      let response = await TransactionsModel.find({
        userId: userId,
        withdrawRequest: value,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  updateTransactionById: async (TransactionId, upi_txn_id, id, session) => {
    try {
      const updatedTransaction = await TransactionsModel.findOneAndUpdate(
        {
          _id: TransactionId, // Assuming that the transaction ID is stored in the '_id' field
        },
        {
          status: 1,
          upiId: upi_txn_id,
          orderId: id,
        },
        {
          new: true,
          session, // Return the updated document after the update
        }
      );
      return updatedTransaction;
    } catch (error) {
      throw error;
    }
  },

  /**
   * existingTransactionsById - Check existing transaction by transactionId id.
   * @param transactionId - transactionId that need to check
   * @returns {Promise<void>}
   */
  existingTransactionsById: async (transactionId) => {
    try {
      let response = await TransactionsModel.findById(transactionId);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = transactionsController;
