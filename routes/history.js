const express = require("express");
const historyController = require("../controllers/history");
const { responseHandler } = require("../helpers");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    let userId = req.user.id;
    let history = await historyController.getAllHistoryByUserId(userId);
    history.reverse();
    if (history) {
      return responseHandler(res, 200, history, null);
    } else {
      responseHandler(res, 400, null, "user history not found");
    }
  } catch (error) {
    console.log("error", error);
    responseHandler(res, 400, null, error.message);
  }
});
module.exports = router;
