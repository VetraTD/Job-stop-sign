import { ApiError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { captureException } from "../lib/sentry.js";

export function notFound(_req, res, _next) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}

export function errorHandler(err, req, res, _next) {
  const isApi = err instanceof ApiError;
  const status = isApi ? err.status : 500;
  const code = isApi ? err.code : "INTERNAL";
  const message = isApi ? err.message : "Internal server error";

  const logLevel = status >= 500 ? "error" : "warn";
  logger[logLevel]({
    err: { name: err.name, message: err.message, stack: err.stack },
    code,
    status,
    path: req.originalUrl,
    method: req.method,
    user_id: req.user?.id,
  }, "request_error");

  if (status >= 500) {
    captureException(err, {
      path: req.originalUrl,
      method: req.method,
      user_id: req.user?.id || "anon",
    });
  }

  const body = { error: { code, message } };
  if (isApi && err.details !== undefined) body.error.details = err.details;
  res.status(status).json(body);
}
