import Url from "../models/url.model.js";
import getNextSequence from "./counter.service.js";
import { encodeBase62 } from "../utils/base62.js";
import ApiError from "../utils/ApiError.js";
import { getCachedUrl, cacheUrl } from "./redis.service.js";
import {
    getAnalyticsSummary,
    saveAnalytics,
} from "./analytics.service.js";

const isExpired = (url) => Boolean(url.expiresAt && url.expiresAt <= new Date());

const recordAnalytics = async (req, shortCode) => {
    try {
        await saveAnalytics(req, shortCode);
    } catch (error) {
        console.warn(`Analytics save failed: ${error.message}`);
    }
};

const serializeUrl = (url, baseUrl) => ({
    longUrl: url.longUrl,
    shortCode: url.shortCode,
    shortUrl: `${baseUrl}/${url.shortCode}`,
    clickCount: url.clickCount,
    clicks: url.clickCount,
    isCustomAlias: url.isCustomAlias,
    expiresAt: url.expiresAt,
    isExpired: isExpired(url),
    createdAt: url.createdAt,
});

export const createShortUrlService = async ({
    longUrl,
    userId,
    customAlias,
    expiresAt,
}) => {
    if (customAlias) {
        const existingAlias = await Url.findOne({ shortCode: customAlias });

        if (existingAlias) {
            throw new ApiError(409, "Custom alias is already in use");
        }
    }

    const reusableUrl = !customAlias && !expiresAt
        ? await Url.findOne({ longUrl, userId, expiresAt: null })
        : null;

    if (reusableUrl && !isExpired(reusableUrl)) {
        return reusableUrl;
    }

    const shortCode = customAlias || encodeBase62(await getNextSequence("url"));

    return await Url.create({
        longUrl,
        shortCode,
        userId,
        isCustomAlias: Boolean(customAlias),
        expiresAt,
    });
};

export const getUserUrls = async ({
    userId,
    baseUrl,
    page = 1,
    limit = 10,
    search = "",
    sort = "createdAt",
}) => {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const skip = (safePage - 1) * safeLimit;
    const sortMap = {
        clicks: { clickCount: -1 },
        createdAt: { createdAt: -1 },
        expiresAt: { expiresAt: 1 },
    };
    const query = { userId };

    if (search) {
        query.$or = [
            { longUrl: { $regex: search, $options: "i" } },
            { shortCode: { $regex: search, $options: "i" } },
        ];
    }

    const [urls, total] = await Promise.all([
        Url.find(query)
            .sort(sortMap[sort] || sortMap.createdAt)
            .skip(skip)
            .limit(safeLimit),
        Url.countDocuments(query),
    ]);

    return {
        items: urls.map((url) => serializeUrl(url, baseUrl)),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
        },
    };
};

export const deleteUserUrl = async (shortCode, userId) => {
    const result = await Url.deleteOne({ shortCode, userId });

    return result.deletedCount > 0;
};

export const getLongUrl = async (shortCode, req) => {
    const cachedUrl = await getCachedUrl(shortCode);

    if (cachedUrl) {
        if (cachedUrl.expiresAt && new Date(cachedUrl.expiresAt) <= new Date()) {
            throw new ApiError(410, "Short URL has expired");
        }

        await Url.updateOne(
            { shortCode },
            { $inc: { clickCount: 1 } }
        );

        await recordAnalytics(req, shortCode);

        return {
            longUrl: cachedUrl.longUrl,
        };
    }

    const url = await Url.findOne({ shortCode });

    if (!url) {
        return null;
    }

    if (isExpired(url)) {
        throw new ApiError(410, "Short URL has expired");
    }

    await Url.updateOne(
        { shortCode },
        { $inc: { clickCount: 1 } }
    );

    await cacheUrl(shortCode, {
        longUrl: url.longUrl,
        expiresAt: url.expiresAt,
    });

    await recordAnalytics(req, shortCode);

    return url;
};

export const getUrlAnalytics = async (shortCode, userId) => {
    const url = await Url.findOne({ shortCode, userId }).select(
        "longUrl shortCode clickCount createdAt expiresAt isCustomAlias"
    );

    if (!url) {
        return null;
    }

    const analytics = await getAnalyticsSummary(shortCode);

    return {
        longUrl: url.longUrl,
        shortCode: url.shortCode,
        clickCount: url.clickCount,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
        isCustomAlias: url.isCustomAlias,
        isExpired: isExpired(url),
        ...analytics,
    };
};
