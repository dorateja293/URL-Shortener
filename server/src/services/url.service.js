import Url from "../models/url.model.js";
import getNextSequence from "./counter.service.js";
import { encodeBase62 } from "../utils/base62.js";
import { getCachedUrl, cacheUrl } from "./redis.service.js";
import {
    getAnalyticsSummary,
    saveAnalytics,
} from "./analytics.service.js";

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
    createdAt: url.createdAt,
});

export const createShortUrlService = async (longUrl, userId) => {
    const existingUrl = await Url.findOne({ longUrl, userId });

    if (existingUrl) {
        return existingUrl;
    }

    const sequence = await getNextSequence("url");

    const shortCode = encodeBase62(sequence);

    const newUrl = await Url.create({
        longUrl,
        shortCode,
        userId,
    });

    return newUrl;
};

export const getUserUrls = async (userId, baseUrl) => {
    const urls = await Url.find({ userId }).sort({ createdAt: -1 });

    return urls.map((url) => serializeUrl(url, baseUrl));
};

export const deleteUserUrl = async (shortCode, userId) => {
    const result = await Url.deleteOne({ shortCode, userId });

    return result.deletedCount > 0;
};

export const getLongUrl = async (shortCode, req) => {
    const cachedUrl = await getCachedUrl(shortCode);

    if (cachedUrl) {
        await Url.updateOne(
            { shortCode },
            { $inc: { clickCount: 1 } }
        );

        await recordAnalytics(req, shortCode);

        return {
            longUrl: cachedUrl,
        };
    }

    const url = await Url.findOne({ shortCode });

    if (!url) {
        return null;
    }

    await Url.updateOne(
        { shortCode },
        { $inc: { clickCount: 1 } }
    );

    await cacheUrl(shortCode, url.longUrl);

    await recordAnalytics(req, shortCode);

    return url;
};

export const getUrlAnalytics = async (shortCode, userId) => {
    const url = await Url.findOne({ shortCode, userId }).select(
        "longUrl shortCode clickCount createdAt"
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
        ...analytics,
    };
};
