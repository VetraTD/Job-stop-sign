import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { globalRateLimit } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/error.js";

import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { cvRouter } from "./routes/cv.js";
import { jobsRouter } from "./routes/jobs.js";
import { packsRouter } from "./routes/packs.js";
import { applicationsRouter } from "./routes/applications.js";
import { hotlineRouter } from "./routes/hotline.js";

export const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (env.CORS_ORIGINS_LIST.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));
app.use(globalRateLimit);

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/cv", cvRouter);
app.use("/jobs", jobsRouter);
app.use("/packs", packsRouter);
app.use("/applications", applicationsRouter);
app.use("/hotline", hotlineRouter);

app.use(notFound);
app.use(errorHandler);
