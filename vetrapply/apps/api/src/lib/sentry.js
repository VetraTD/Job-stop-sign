import * as Sentry from "@sentry/node";
import { env } from "../config/env.js";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.IS_PROD ? 0.1 : 0,
  });
}

export const sentryEnabled = !!env.SENTRY_DSN;
export { Sentry };

export function captureException(err, context = {}) {
  if (!sentryEnabled) return;
  Sentry.withScope((scope) => {
    for (const [k, v] of Object.entries(context)) scope.setTag(k, String(v));
    Sentry.captureException(err);
  });
}
