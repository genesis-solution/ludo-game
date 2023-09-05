const Sentry = require("@sentry/node");
const config = require("./helpers/config");

if (config.NODE_ENV === "production" || config.NODE_ENV === "staging") {
  Sentry.init({
    dsn: config.NODE_APP_SENTRY_DSN_PROD || "",

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
  process.on("uncaughtException", (error) => {
    console.error("Uncaught ExceptionSami:", error);
    Sentry.captureException(error);
    // process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Promise RejectionSS :", reason);
    Sentry.captureException(reason);
    // process.exit(1);
  });
}
module.exports = Sentry;
