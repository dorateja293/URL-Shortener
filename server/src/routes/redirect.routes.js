import express from "express";
import { redirectUrl } from "../controllers/url.controller.js";

const router = express.Router();

router.get("/:shortCode", redirectUrl);

export default router;