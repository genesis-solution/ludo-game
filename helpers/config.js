require("dotenv").config();
const config = {
  NODE_ENV: process.env.NODE_ENV,
  SMS_KEY: process.env.SMS_KEY,
  TELEGRAM_GROUPID: process.env.TELEGRAM_GROUPID,
  BOT_TOKEN: process.env.BOT_TOKEN,
  NODE_APP_SENTRY_DSN_PROD: process.env.NODE_APP_SENTRY_DSN_PROD,
  EMAIL: process.env.EMAIL,
  PASSWORD: process.env.PASSWORD,
  DB_URI: process.env.DB_URI,
  PAY_ON_UPI_SECRET: process.env.PAY_ON_UPI_SECRET,
  TOKEN_SECRET: process.env.TOKEN_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  PORT: process.env.PORT,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  USE_SECURE_COOKIE: process.env.USE_SECURE_COOKIE,
};

module.exports = config;
