import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("URL Shortener API Running...");
});

export default app;