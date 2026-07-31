import redisClient from "../config/redis.js";

const CACHE_EXPIRY = 60 * 60;

export const getCachedUrl = async (shortCode) => {
    if (!redisClient.isReady) {
        return null;
    }

    try {
        return await redisClient.get(shortCode);
    } catch (error) {
        console.warn(`Redis read failed: ${error.message}`);
        return null;
    }
};

export const cacheUrl = async (shortCode, longUrl) => {
    if (!redisClient.isReady) {
        return;
    }

    try {
        await redisClient.set(shortCode, longUrl, {
            EX: CACHE_EXPIRY,
        });
    } catch (error) {
        console.warn(`Redis write failed: ${error.message}`);
    }
};
