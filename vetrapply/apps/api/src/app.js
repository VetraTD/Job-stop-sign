import express from "express";
import { healthRouter } from "./routes/health.js";

export const app = express();

app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const code = err.code || "INTERNAL";
  res.status(status).json({ error: { code, message: err.message || "Internal error" } });
});
