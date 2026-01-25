const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');



async function claimStock(productId, quantity = 1) {
  const key = `product:${productId}:stock`;

  const luaScript = `
    const stock = tonumber(redis.call("get", KEYS[1]))
    if not stock or stock < tonumber(ARGV[1]) then return 0 end
    redis.call("decrby", KEYS[1], ARGV[1])
    return 1
  `;

  const result = await redis.eval(luaScript, 1, key, quantity);
  return result;
}

async function setProductStock(productId, stock) {
  await redis.set(`product:${productId}:stock`, stock);
}


async function checkRateLimit(userId, limit = 5, windowSeconds = 60) {
  const key = `rate_limit:${userId}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  return current <= limit;
}

async function checkIdempotency(key) {
  return await redis.get(`idempotency:${key}`);
}

async function setIdempotency(key, val) {
  await redis.set(`idempotency:${key}`, val, 'EX', 86400);
}

module.exports = {
  redis,
  claimStock,
  setProductStock,
  checkRateLimit,
  checkIdempotency,
  setIdempotency
};
