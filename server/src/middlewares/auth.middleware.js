import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new ApiError(401, "Authentication required"));
    }

    if (!process.env.JWT_SECRET) {
        return next(new ApiError(500, "JWT_SECRET is required"));
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return next(new ApiError(401, "User not found"));
        }

        req.user = user;

        next();
    } catch (error) {
        next(new ApiError(401, "Invalid or expired token"));
    }
};

export default authenticate;
