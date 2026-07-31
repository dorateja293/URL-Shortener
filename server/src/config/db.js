import mongoose from "mongoose";

const CONNECTION_TIMEOUT_MS = 8000;

const withTimeout = (promise, timeoutMs) => {
    let timeoutId;

    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`MongoDB connection timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is required");
        }

        const conn = await withTimeout(
            mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
            }),
            CONNECTION_TIMEOUT_MS
        );

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB Connection Failed");
        console.error(error.message);

        process.exit(1);
    }
};

export default connectDB;
