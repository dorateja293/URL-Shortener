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

export const createShortUrlService = async (longUrl) => {
    const existingUrl = await Url.findOne({ longUrl });

    if (existingUrl) {
        return existingUrl;
    }

    const sequence = await getNextSequence("url");

    const shortCode = encodeBase62(sequence);

    const newUrl = await Url.create({
        longUrl,
        shortCode,
    });

    return newUrl;
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

export const getUrlAnalytics = async (shortCode) => {
    const url = await Url.findOne({ shortCode }).select(
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
