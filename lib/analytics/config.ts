/**
 * Analytics and ad-tag settings. Every value is a NEXT_PUBLIC_* var, which `next build` inlines,
 * so on Vercel they must be set before the deploy that should use them.
 * An unset value turns that piece off; nothing else breaks. See docs/analytics.md.
 */

/** Super-property `site`, shared with the Nexora landings so one PostHog project can split traffic. */
export const ANALYTICS_SITE = "leogcode";

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
export const META_DOMAIN_VERIFICATION =
  process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION || "";

/** Google Ads tag id, `AW-…`. The labels identify the two conversion actions. */
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
export const GOOGLE_ADS_BOOKING_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL || "";
export const GOOGLE_ADS_LEAD_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL || "";

/* ─────────────────────────────────────────────
   BEFORE A CHOICE — the one switch for what PostHog may send while the cookie banner is still
   waiting for Accept or Reject. The privacy page reads it too, so its text follows the switch.
   ───────────────────────────────────────────── */

/**
 * - "anonymous_counts" (active, Leonel's decision of 2026-10-16): only BEFORE_CHOICE_EVENTS, sent
 *   by a separate PostHog instance in cookieless mode: no cookie, no localStorage, no id on the
 *   device, no person profile; no autocapture, heatmaps, rage/dead clicks or replay. PostHog tells
 *   visitors apart with its own daily server-side hash. Needs "Cookieless server hash mode" on in
 *   the PostHog project settings, otherwise PostHog drops these events.
 * - "nothing": PostHog does not load at all until Accept.
 * After Accept: full analytics. After Reject: nothing, whatever this says.
 */
export type BeforeChoiceMode = "anonymous_counts" | "nothing";

export const BEFORE_CHOICE: BeforeChoiceMode = "anonymous_counts";

/** What "anonymous_counts" lets through before a choice. Every other event waits for Accept. */
export const BEFORE_CHOICE_EVENTS: readonly string[] = [
  "$pageview",
  "cta_clicked",
  "booking_opened",
  "booking_scheduled",
  "lead_form_viewed",
  "lead_form_submitted",
  "lead_form_success",
];

/** Whether `event` may be sent to PostHog while the visitor has not chosen yet. */
export function beforeChoiceAllows(
  event: string,
  mode: BeforeChoiceMode = BEFORE_CHOICE,
): boolean {
  return mode === "anonymous_counts" && BEFORE_CHOICE_EVENTS.includes(event);
}

/** The PostHog app that matches the ingestion host (toolbar, heatmaps on the live page). */
export function posthogUiHost(apiHost: string): string | undefined {
  if (apiHost.includes("eu.i.posthog.com")) return "https://eu.posthog.com";
  if (apiHost.includes("us.i.posthog.com")) return "https://us.posthog.com";
  return undefined;
}
