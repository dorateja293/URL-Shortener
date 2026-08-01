import validator from "validator";
import ApiError from "../utils/ApiError.js";

export const validateRegister = ({ name, email, password }) => {
    if (!name?.trim()) {
        throw new ApiError(400, "Name is required");
    }

    if (!email?.trim()) {
        throw new ApiError(400, "Email is required");
    }

    if (!validator.isEmail(email)) {
        throw new ApiError(400, "Invalid email");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }
};

export const validateLogin = ({ email, password }) => {

    if (!email?.trim()) {
        throw new ApiError(400, "Email is required");
    }

    if (!validator.isEmail(email)) {
        throw new ApiError(400, "Invalid email");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

};
