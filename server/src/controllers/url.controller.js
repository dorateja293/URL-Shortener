import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import validateUrl from "../validators/url.validator.js";

import {
    createShortUrlService,
    deleteUserUrl,
    getLongUrl,
    getUrlAnalytics,
    getUserUrls,
} from "../services/url.service.js";

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

export const createShortUrl = asyncHandler(async (req, res) => {
    const { longUrl } = req.body;

    // Validate URL
    validateUrl(longUrl);

    // Create short URL
    const url = await createShortUrlService(longUrl, req.user._id);

    res.status(201).json({
        success: true,
        message: "Short URL created successfully",
        data: {
            longUrl: url.longUrl,
            shortCode: url.shortCode,
            shortUrl: `${getBaseUrl(req)}/${url.shortCode}`,
            clickCount: url.clickCount,
            createdAt: url.createdAt,
        },
    });
});

export const getMyUrls = asyncHandler(async (req, res) => {
    const urls = await getUserUrls(req.user._id, getBaseUrl(req));

    res.status(200).json({
        success: true,
        message: "URLs fetched successfully",
        data: urls,
    });
});

export const deleteShortUrl = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    const deleted = await deleteUserUrl(shortCode, req.user._id);

    if (!deleted) {
        throw new ApiError(404, "Short URL not found");
    }

    res.status(200).json({
        success: true,
        message: "Short URL deleted successfully",
    });
});

export const redirectUrl = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;

    const url = await getLongUrl(shortCode, req);

    if (!url) {
        throw new ApiError(404, "Short URL not found");
    }

    res.redirect(url.longUrl);
});

export const getAnalytics = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;

    const analytics = await getUrlAnalytics(shortCode, req.user._id);

    if (!analytics) {
        throw new ApiError(404, "Short URL not found");
    }

    res.status(200).json({
        success: true,
        message: "Analytics fetched successfully",
        data: analytics,
    });
});
