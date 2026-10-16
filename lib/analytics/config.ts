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

/** The PostHog app that matches the ingestion host (toolbar, heatmaps on the live page). */
export function posthogUiHost(apiHost: string): string | undefined {
  if (apiHost.includes("eu.i.posthog.com")) return "https://eu.posthog.com";
  if (apiHost.includes("us.i.posthog.com")) return "https://us.posthog.com";
  return undefined;
}
