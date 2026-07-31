import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import validateUrl from "../validators/url.validator.js";

import {
    createShortUrlService,
    getLongUrl,
} from "../services/url.service.js";

export const createShortUrl = asyncHandler(async (req, res) => {
    const { longUrl } = req.body;

    // Validate URL
    validateUrl(longUrl);

    // Create short URL
    const url = await createShortUrlService(longUrl);

    res.status(201).json({
        success: true,
        message: "Short URL created successfully",
        data: {
            longUrl: url.longUrl,
            shortCode: url.shortCode,
            shortUrl: `${req.protocol}://${req.get("host")}/${url.shortCode}`,
        },
    });
});

export const redirectUrl = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;

    const url = await getLongUrl(shortCode);

    if (!url) {
        throw new ApiError(404, "Short URL not found");
    }

    res.redirect(url.longUrl);
});