import Url from "../models/url.model.js";
import getNextSequence from "./counter.service.js";
import { encodeBase62 } from "../utils/base62.js";

export const createShortUrlService = async (longUrl) => {
    // Check if URL already exists
    const existingUrl = await Url.findOne({ longUrl });

    if (existingUrl) {
        return existingUrl;
    }

    // Generate sequence number
    const sequence = await getNextSequence("url");

    // Encode using Base62
    const shortCode = encodeBase62(sequence);

    // Save to MongoDB
    const newUrl = await Url.create({
        longUrl,
        shortCode,
    });

    return newUrl;
};

export const getLongUrl = async (shortCode) => {
    const url = await Url.findOne({ shortCode });

    if (!url) {
        return null;
    }

    url.clickCount += 1;

    await url.save();

    return url;
};