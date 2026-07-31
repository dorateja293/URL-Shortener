import Analytics from "../models/analytics.model.js";

export const getAnalyticsSummary = async (shortCode) => {

    const totalClicks = await Analytics.countDocuments({
        shortCode,
    });

    return {
        totalClicks,
    };
};