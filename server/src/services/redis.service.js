import redisClient from "../config/redis.js";

const CACHE_EXPIRY = 60 * 60; 

export const getCachedUrl = async (shortCode) => {
    return await redisClient.get(shortCode);
};

export const cacheUrl = async (shortCode, longUrl) => {
    await redisClient.set(shortCode, longUrl, {
        EX: CACHE_EXPIRY,
    });
};