import asyncHandler from "../utils/asyncHandler.js";
import {
    getGoogleAuthUrl,
    loginUser,
    loginWithGoogleCode,
    registerUser,
    sanitizeUser,
} from "../services/auth.service.js";
import {
    validateLogin,
    validateRegister,
} from "../validators/auth.validator.js";

const sendAuthResponse = (res, status, message, user, token) => {
    res.status(status).json({
        success: true,
        message,
        data: {
            token,
            user: sanitizeUser(user),
        },
    });
};

export const register = asyncHandler(async (req, res) => {
    validateRegister(req.body);

    const { user, token } = await registerUser(req.body);

    sendAuthResponse(res, 201, "Registration successful", user, token);
});

export const login = asyncHandler(async (req, res) => {
    validateLogin(req.body);

    const { user, token } = await loginUser(req.body);

    sendAuthResponse(res, 200, "Login successful", user, token);
});

export const googleLogin = asyncHandler(async (req, res) => {
    res.redirect(getGoogleAuthUrl());
});

export const googleCallback = asyncHandler(async (req, res) => {
    const { user, token } = await loginWithGoogleCode(req.query.code);
    const redirectUrl = process.env.OAUTH_SUCCESS_REDIRECT_URL;

    if (redirectUrl) {
        const url = new URL(redirectUrl);
        url.searchParams.set("token", token);
        res.redirect(url.toString());
        return;
    }

    sendAuthResponse(res, 200, "Google login successful", user, token);
});

export const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: {
            user: sanitizeUser(req.user),
        },
    });
});
