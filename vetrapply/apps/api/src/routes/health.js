import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "vetrapply-api",
    version: process.env.npm_package_version || "0.1.0",
    uptime_s: Math.round(process.uptime()),
  });
});
