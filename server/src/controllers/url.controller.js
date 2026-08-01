import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import QRCode from "qrcode";
import validateUrl, {
    parseExpiration,
    validateAlias,
} from "../validators/url.validator.js";

import {
    createShortUrlService,
    deleteUserUrl,
    getLongUrl,
    getUrlAnalytics,
    getUserUrls,
} from "../services/url.service.js";

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

export const createShortUrl = asyncHandler(async (req, res) => {
    const { longUrl, customAlias, expiresIn, expiresAt } = req.body;

    // Validate URL
    validateUrl(longUrl);
    validateAlias(customAlias);
    const expiration = parseExpiration({ expiresIn, expiresAt });

    // Create short URL
    const url = await createShortUrlService({
        longUrl,
        userId: req.user._id,
        customAlias,
        expiresAt: expiration,
    });

    res.status(201).json({
        success: true,
        message: "Short URL created successfully",
        data: {
            longUrl: url.longUrl,
            shortCode: url.shortCode,
            shortUrl: `${getBaseUrl(req)}/${url.shortCode}`,
            clickCount: url.clickCount,
            expiresAt: url.expiresAt,
            isCustomAlias: url.isCustomAlias,
            createdAt: url.createdAt,
        },
    });
});

export const getMyUrls = asyncHandler(async (req, res) => {
    const result = await getUserUrls({
        userId: req.user._id,
        baseUrl: getBaseUrl(req),
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        sort: req.query.sort,
    });

    res.status(200).json({
        success: true,
        message: "URLs fetched successfully",
        data: result.items,
        pagination: result.pagination,
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

export const getQrCode = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    const analytics = await getUrlAnalytics(shortCode, req.user._id);

    if (!analytics) {
        throw new ApiError(404, "Short URL not found");
    }

    if (analytics.isExpired) {
        throw new ApiError(410, "Short URL has expired");
    }

    const qrBuffer = await QRCode.toBuffer(`${getBaseUrl(req)}/${shortCode}`, {
        type: "png",
        width: 300,
        margin: 2,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="${shortCode}-qrcode.png"`);
    res.status(200).send(qrBuffer);
});
