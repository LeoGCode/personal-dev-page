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

/**
 * Consent withdrawn (here or in another tab): stop recording at once, without
 * sending what is buffered. A later Accept records again from the next page
 * load.
 */
export function disableSentryReplay() {
  const replay = Sentry.getReplay();
  if (replay) void replay.stop();
}
