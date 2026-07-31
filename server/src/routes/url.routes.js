import express from "express";
import { createShortUrl } from "../controllers/url.controller.js";

const router = express.Router();

router.post("/shorten", createShortUrl);

export default router;