import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            minlength: 6,
            select: false,
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        avatar: {
            type: String,
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default mongoose.model("User", userSchema);
