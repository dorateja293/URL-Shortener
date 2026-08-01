import Analytics from "../models/analytics.model.js";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";

const getClientIp = (req) => {
    const forwardedFor = req.get("x-forwarded-for");

    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || "unknown";
};

export const saveAnalytics = async (req, shortCode) => {
    if (!req) {
        return;
    }

    const parser = new UAParser(req.get("user-agent") || "");

    const result = parser.getResult();

    // Hash IP instead of storing raw IP
    const ipHash = crypto
        .createHash("sha256")
        .update(getClientIp(req))
        .digest("hex");

    await Analytics.create({
        shortCode,

        ip: ipHash,

        browser: result.browser.name || "Unknown",

        os: result.os.name || "Unknown",

        device: result.device.type || "Desktop",

        referrer: req.get("Referer") || "Direct",
    });
};

export const getAnalyticsSummary = async (shortCode) => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6);

    const [totalClicks, todayClicks, yesterdayClicks, weekClicks, recentClicks, browsers, operatingSystems, devices, referrers, dailyClicks] =
        await Promise.all([
            Analytics.countDocuments({ shortCode }),
            Analytics.countDocuments({ shortCode, timestamp: { $gte: startOfToday } }),
            Analytics.countDocuments({
                shortCode,
                timestamp: {
                    $gte: startOfYesterday,
                    $lt: startOfToday,
                },
            }),
            Analytics.countDocuments({ shortCode, timestamp: { $gte: startOfWeek } }),
            Analytics.find({ shortCode })
                .sort({ timestamp: -1 })
                .limit(20)
                .select("-_id browser os device referrer timestamp"),
            Analytics.aggregate([
                { $match: { shortCode } },
                { $group: { _id: "$browser", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Analytics.aggregate([
                { $match: { shortCode } },
                { $group: { _id: "$os", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Analytics.aggregate([
                { $match: { shortCode } },
                { $group: { _id: "$device", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Analytics.aggregate([
                { $match: { shortCode } },
                { $group: { _id: "$referrer", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Analytics.aggregate([
                {
                    $match: {
                        shortCode,
                        timestamp: { $gte: startOfWeek },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$timestamp",
                            },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

    const normalizeBreakdown = (items) =>
        items.map((item) => ({
            name: item._id || "Unknown",
            count: item.count,
        }));

    return {
        totalClicks,
        todayClicks,
        yesterdayClicks,
        weekClicks,
        dailyClicks: dailyClicks.map((item) => ({
            date: item._id,
            clicks: item.count,
        })),
        recentClicks,
        browsers: normalizeBreakdown(browsers),
        operatingSystems: normalizeBreakdown(operatingSystems),
        devices: normalizeBreakdown(devices),
        referrers: normalizeBreakdown(referrers),
    };
};

