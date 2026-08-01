import express from "express";
import {
    createShortUrl,
    deleteShortUrl,
    getAnalytics,
    getMyUrls,
} from "../controllers/url.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/my", getMyUrls);
router.post("/shorten", createShortUrl);
router.get("/:shortCode/analytics", getAnalytics);
router.delete("/:shortCode", deleteShortUrl);

export default router;
