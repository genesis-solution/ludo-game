const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient();

(async () => {
  await client.connect();
})();

client.on("error", (error) => {
  console.error("Redis Error:", error);
});
client.on("connect", (error) => {
  console.error("redisconnected:");
})
module.exports = { client };
