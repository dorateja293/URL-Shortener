import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
    {
        shortCode: {
            type: String,
            required: true,
            index: true,
        },
        ip: String,
        browser: String,
        os: String,
        device: String,
        referrer: String,
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        versionKey: false,
    }
);

export default mongoose.model("Analytics", analyticsSchema);