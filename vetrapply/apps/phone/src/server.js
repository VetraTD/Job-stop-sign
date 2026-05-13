import "dotenv/config";
import express from "express";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "vetrapply-phone",
    version: "0.1.0",
    uptime_s: Math.round(process.uptime()),
    status: "scaffold-only (M5 will lift full phone service)",
  });
});

app.listen(PORT, () => {
  console.log(`[phone] listening on :${PORT}`);
});
