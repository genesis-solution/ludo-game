const express = require("express");
const router = express.Router();

router.get("/test-error", (req, res, next) => {
  try {
    // Generate an intentional error for testing
    throw new Error("This is a test error.");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
