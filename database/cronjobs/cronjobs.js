const cron = require("node-cron");
const challengesController = require("../../controllers/challenges");
// Define and schedule the cron job
cron.schedule('*/59 * * * *', async () => {
  try {
    await challengesController.UpdateOpenChallenges();

    console.log("Open challenges deleted by cron jobs");
  } catch (error) {
    console.error("Error executing cron job:", error);
  }
});