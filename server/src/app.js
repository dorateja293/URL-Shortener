import express from "express";
import apiRoutes from "./routes/api.routes.js";
import redirectRoutes from "./routes/redirect.routes.js";

const app = express();

app.use(express.json());

app.use("/api/url", apiRoutes);

app.use("/", redirectRoutes);

export default app;