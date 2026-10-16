import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance — 100% in dev, 10% in prod (adjust based on traffic)
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay — capture 10% of sessions, 100% on error. The replay
  // integration itself is added only after cookie consent
  // (lib/analytics/sentry-replay.ts).
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Structured logging
  enableLogs: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
