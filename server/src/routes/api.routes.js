import express from "express";
import {
    createShortUrl,
    getAnalytics,
} from "../controllers/url.controller.js";

const router = express.Router();

router.post("/shorten", createShortUrl);
router.get("/:shortCode/analytics", getAnalytics);

export default router;
