const session = require("express-session");
const RedisStore = require('connect-redis').default;
const redis = require('redis');
const config = require("../helpers/config");
require("dotenv").config(); // Load environment variables from .env file

const redisClient = redis.createClient();

(async () => {
  await redisClient.connect();
})();

redisClient.on("error", (error) => {
  console.error("Redis session Error:", error);
});
redisClient.on("connect", (error) => {
  console.error("redis session connected:");
})

const store = new RedisStore({
  client: redisClient,
});

store.on("error", (error) => {
  console.error("RedisStore connection error:", error);
});
const thirtyDaysInMilliseconds = 30 * 24 * 60 * 60 * 1000;
const maxAgeForSessionCookie = thirtyDaysInMilliseconds;

// Define options based on environment
const options = {
  secret: config.SESSION_SECRET,
  store: store,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: false,
    maxAge: parseInt(maxAgeForSessionCookie),
  },
};

if (config.NODE_ENV === "production" || config.NODE_ENV === "staging") {
  options.cookie.secure = true; // Use an environment variable to conditionally enable secure cookie
  options.cookie.domain = ".gotiking.com"; // Use an environment variable for the cookie domain or leave it undefined
}

module.exports = { store, options };
