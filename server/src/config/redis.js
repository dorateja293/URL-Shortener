import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

redisClient.on("connect", () => {
    console.log("Redis Connected");
});

export const connectRedis = async () => {
    if (!process.env.REDIS_URL) {
        console.warn("REDIS_URL is not set. Continuing without cache.");
        return;
    }

    try {
        await redisClient.connect();
    } catch (error) {
        console.warn(`Redis unavailable. Continuing without cache: ${error.message}`);
    }
};

export default redisClient;
