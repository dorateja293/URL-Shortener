import rateLimit from "express-rate-limit";

const createLimiter = ({ windowMs, max, message }) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message,
        },
    });

export const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many authentication attempts. Please try again later.",
});

export const shortenLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: "Too many URL shortening requests. Please try again later.",
});
