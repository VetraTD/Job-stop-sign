import { env } from "./config/env.js";
import "./lib/sentry.js";
import { logger } from "./lib/logger.js";
import { app } from "./app.js";

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "api_started");
});

function shutdown(signal) {
  logger.info({ signal }, "api_shutdown");
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
