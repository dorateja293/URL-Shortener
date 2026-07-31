import Url from "../models/url.model.js";

export const getLongUrl = async (shortCode) => {
    const url = await Url.findOne({ shortCode });

    if (!url) {
        return null;
    }

    url.clickCount += 1;
    await url.save();

    return url;
};