import * as Sentry from "@sentry/nextjs";

if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_SENTRY_DSN
) {
  throw new Error("NEXT_PUBLIC_SENTRY_DSN is required in production");
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance — 100% in dev, 10% in prod (adjust based on traffic)
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Structured logging
  enableLogs: true,
});
