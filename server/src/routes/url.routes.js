import express from "express";
import {
    createShortUrl,
    redirectUrl,
} from "../controllers/url.controller.js";

const router = express.Router();

router.post("/shorten", createShortUrl);

// Analytics route (we'll implement later)
router.get("/:shortCode", redirectUrl);

export default router;