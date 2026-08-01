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

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
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

urlSchema.index({ userId: 1, longUrl: 1 });

const Url = mongoose.model("Url", urlSchema);

export default Url;
