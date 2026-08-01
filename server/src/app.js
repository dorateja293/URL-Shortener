import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import apiRoutes from "./routes/api.routes.js";
import redirectRoutes from "./routes/redirect.routes.js";

import errorHandler from "./middlewares/error.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import {
    authLimiter,
    shortenLimiter,
} from "./middlewares/rateLimit.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
    });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/url/shorten", shortenLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/url", apiRoutes);

app.use("/", redirectRoutes);

// MUST BE LAST
app.use(errorHandler);

export default app;
