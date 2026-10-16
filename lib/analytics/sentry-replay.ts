import * as Sentry from "@sentry/nextjs";

let added = false;

/**
 * Sentry session replay is a recording too, so it starts only after the
 * visitor accepts cookies (instrumentation-client.ts no longer adds it).
 */
export function enableSentryReplay() {
  if (added || !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  added = true;
  Sentry.addIntegration(
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  );
}
