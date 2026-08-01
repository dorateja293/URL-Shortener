import redisClient from "../config/redis.js";

const CACHE_EXPIRY = 60 * 60;

export const getCachedUrl = async (shortCode) => {
    if (!redisClient.isReady) {
        return null;
    }

    try {
        const value = await redisClient.get(shortCode);

        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value);
        } catch {
            return {
                longUrl: value,
                expiresAt: null,
            };
        }
    } catch (error) {
        console.warn(`Redis read failed: ${error.message}`);
        return null;
    }
};

export const cacheUrl = async (shortCode, urlData) => {
    if (!redisClient.isReady) {
        return;
    }

    try {
        await redisClient.set(shortCode, JSON.stringify(urlData), {
            EX: CACHE_EXPIRY,
        });
    } catch (error) {
        console.warn(`Redis write failed: ${error.message}`);
    }
};
