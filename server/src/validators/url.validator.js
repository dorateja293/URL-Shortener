import validator from "validator";
import ApiError from "../utils/ApiError.js";

const ALIAS_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;
const EXPIRATION_DAYS = {
    "1d": 1,
    "7d": 7,
    "30d": 30,
};

export const validateAlias = (alias) => {
    if (!alias) {
        return;
    }

    if (!ALIAS_PATTERN.test(alias)) {
        throw new ApiError(
            400,
            "Custom alias must be 3-32 characters and contain only letters, numbers, dashes, or underscores"
        );
    }
};

export const parseExpiration = ({ expiresIn, expiresAt } = {}) => {
    if (expiresIn && expiresAt) {
        throw new ApiError(400, "Use either expiresIn or expiresAt, not both");
    }

    if (expiresIn) {
        const days = EXPIRATION_DAYS[expiresIn];

        if (!days) {
            throw new ApiError(400, "expiresIn must be one of: 1d, 7d, 30d");
        }

        const expiration = new Date();
        expiration.setDate(expiration.getDate() + days);
        return expiration;
    }

    if (expiresAt) {
        const expiration = new Date(expiresAt);

        if (Number.isNaN(expiration.getTime())) {
            throw new ApiError(400, "expiresAt must be a valid date");
        }

        if (expiration <= new Date()) {
            throw new ApiError(400, "Expiration must be in the future");
        }

        return expiration;
    }

    return null;
};

const validateUrl = (longUrl) => {
    if (!longUrl) {
        throw new ApiError(400, "Long URL is required");
    }

    if (
        !validator.isURL(longUrl, {
            protocols: ["http", "https"],
            require_protocol: true,
        })
    ) {
        throw new ApiError(400, "Invalid URL");
    }
};

export default validateUrl;
