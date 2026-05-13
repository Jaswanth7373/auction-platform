const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    const isCloud = process.env.REDIS_HOST &&
      process.env.REDIS_HOST !== 'localhost' &&
      process.env.REDIS_HOST !== '127.0.0.1';

    const config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      retryStrategy: (times) => {
        if (times > 5) {
          logger.warn('Redis max retries reached. Disabling cache.');
          return null; // stop retrying
        }
        return Math.min(times * 500, 3000);
      },
      maxRetriesPerRequest: 1,
      connectTimeout: 10000,
      enableOfflineQueue: false,
      lazyConnect: false,
    };

    // Add password if provided
    if (process.env.REDIS_PASSWORD) {
      config.password = process.env.REDIS_PASSWORD;
    }

    // Add TLS for Redis Cloud
    if (isCloud) {
      config.tls = { rejectUnauthorized: false };
    }

    redisClient = new Redis(config);

    redisClient.on('connect', () => logger.info('✅ Redis Connected'));
    redisClient.on('ready', () => logger.info('✅ Redis Ready'));
    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
      // Disable redis on repeated failures
      if (err.message.includes('ECONNREFUSED') ||
          err.message.includes('ETIMEDOUT') ||
          err.message.includes('ERR_SSL')) {
        redisClient = null;
      }
    });
    redisClient.on('close', () => logger.warn('Redis connection closed'));
    redisClient.on('reconnecting', () => logger.info('Redis reconnecting...'));

  } catch (error) {
    logger.warn(`⚠️ Redis failed: ${error.message}. Caching disabled.`);
    redisClient = null;
  }
};

const getRedisClient = () => redisClient;

const cacheSet = async (key, value, ttlSeconds = 3600) => {
  try {
    if (!redisClient) return false;
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
};

const cacheGet = async (key) => {
  try {
    if (!redisClient) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

const cacheDel = async (key) => {
  try {
    if (!redisClient) return false;
    await redisClient.del(key);
    return true;
  } catch (err) {
    return false;
  }
};

const cacheDelPattern = async (pattern) => {
  try {
    if (!redisClient) return false;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
    return true;
  } catch (err) {
    return false;
  }
};

module.exports = connectRedis;
Object.assign(module.exports, {
  getRedisClient, cacheSet, cacheGet, cacheDel, cacheDelPattern
});