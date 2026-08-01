import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const getJwtConfig = () => {
    if (!process.env.JWT_SECRET) {
        throw new ApiError(500, "JWT_SECRET is required");
    }

    return {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    };
};

const signToken = (user) => {
    const { secret, expiresIn } = getJwtConfig();

    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
        },
        secret,
        { expiresIn }
    );
};

const getGoogleConfig = () => {
    const {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL,
    } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
        throw new ApiError(500, "Google OAuth environment variables are required");
    }

    return {
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackUrl: GOOGLE_CALLBACK_URL,
    };
};

export const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    authProvider: user.authProvider,
});

export const registerUser = async ({ name, email, password }) => {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new ApiError(409, "Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        authProvider: "local",
    });

    return {
        user,
        token: signToken(user),
    };
};

export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    return {
        user,
        token: signToken(user),
    };
};

export const getGoogleAuthUrl = () => {
    const { clientId, callbackUrl } = getGoogleConfig();
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "select_account",
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

export const loginWithGoogleCode = async (code) => {
    if (!code) {
        throw new ApiError(400, "Google authorization code is required");
    }

    const { clientId, clientSecret, callbackUrl } = getGoogleConfig();

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: callbackUrl,
            grant_type: "authorization_code",
        }),
    });

    if (!tokenResponse.ok) {
        throw new ApiError(401, "Google token exchange failed");
    }

    const tokens = await tokenResponse.json();

    const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
            Authorization: `Bearer ${tokens.access_token}`,
        },
    });

    if (!profileResponse.ok) {
        throw new ApiError(401, "Google profile fetch failed");
    }

    const profile = await profileResponse.json();

    if (!profile.email) {
        throw new ApiError(401, "Google account email is required");
    }

    const googleUser = {
        name: profile.name || profile.email.split("@")[0],
        email: profile.email,
        googleId: profile.sub,
        avatar: profile.picture,
        authProvider: "google",
    };

    let user = await User.findOne({
        $or: [
            { googleId: profile.sub },
            { email: profile.email },
        ],
    });

    if (user) {
        Object.assign(user, googleUser);
        await user.save();
    } else {
        user = await User.create(googleUser);
    }

    return {
        user,
        token: signToken(user),
    };
};
