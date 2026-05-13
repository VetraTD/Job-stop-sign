import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "vetrapply-api" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.body["password"]',
      'req.body["token"]',
    ],
    censor: "[redacted]",
  },
  transport: env.IS_PROD
    ? undefined
    : { target: "pino-pretty", options: { colorize: true, singleLine: true } },
});
