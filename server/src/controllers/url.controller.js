import Url from "../models/url.model.js";
import getNextSequence from "../services/counter.service.js";
import { encodeBase62 } from "../utils/base62.js";

export const createShortUrl = async (req, res) => {
    try {
        const { longUrl } = req.body;

        // Validate request
        if (!longUrl) {
            return res.status(400).json({
                success: false,
                message: "Long URL is required",
            });
        }

        // Check if URL already exists
        const existingUrl = await Url.findOne({ longUrl });

        if (existingUrl) {
            return res.status(200).json({
                success: true,
                data: {
                    longUrl: existingUrl.longUrl,
                    shortCode: existingUrl.shortCode,
                    shortUrl: `${req.protocol}://${req.get("host")}/${existingUrl.shortCode}`,
                },
            });
        }

        // Generate unique numeric ID
        const sequence = await getNextSequence("url");

        // Convert to Base62
        const shortCode = encodeBase62(sequence);

        // Save to MongoDB
        const newUrl = await Url.create({
            longUrl,
            shortCode,
        });

        return res.status(201).json({
            success: true,
            data: {
                longUrl: newUrl.longUrl,
                shortCode: newUrl.shortCode,
                shortUrl: `${req.protocol}://${req.get("host")}/${newUrl.shortCode}`,
            },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};