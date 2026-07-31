import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
    {
        longUrl: {
            type: String,
            required: true,
            trim: true,
        },

        shortCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        clickCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Url = mongoose.model("Url", urlSchema);

export default Url;