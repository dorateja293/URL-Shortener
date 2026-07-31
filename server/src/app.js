import express from "express";

import apiRoutes from "./routes/api.routes.js";
import redirectRoutes from "./routes/redirect.routes.js";

import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
    });
});

app.use("/api/url", apiRoutes);

app.use("/", redirectRoutes);

// MUST BE LAST
app.use(errorHandler);

export default app;
