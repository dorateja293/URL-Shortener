import Url from "../models/url.model.js";
import getNextSequence from "./counter.service.js";
import { encodeBase62 } from "../utils/base62.js";
import { getCachedUrl, cacheUrl } from "./redis.service.js";

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

export const getLongUrl = async (shortCode) => {

    const cachedUrl = await getCachedUrl(shortCode);

    if (cachedUrl) {

        console.log("Cache Hit");

        await Url.updateOne(
            { shortCode },
            { $inc: { clickCount: 1 } }
        );

        return {
            longUrl: cachedUrl,
        };
    }

    console.log("Cache Miss");

    const url = await Url.findOne({ shortCode });

    if (!url) {
        return null;
    }

    await Url.updateOne(
        { shortCode },
        { $inc: { clickCount: 1 } }
    );

    await cacheUrl(shortCode, url.longUrl);

    return url;
};