import express from "express";

import {
    getMe,
    googleCallback,
    googleLogin,
    login,
    register,
} from "../controllers/auth.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.get("/me", authenticate, getMe);

export default router;
