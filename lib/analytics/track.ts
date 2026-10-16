import type { PostHog } from "posthog-js";
import {
  ANALYTICS_SITE,
  POSTHOG_HOST,
  POSTHOG_KEY,
  posthogUiHost,
} from "@/lib/analytics/config";
import { getConsent, type ConsentChoice } from "@/lib/analytics/consent";

export type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

/* ─────────────────────────────────────────────
   ATTRIBUTION — the ad click parameters of the landing URL, kept for the
   whole visit (client-side navigation drops them from the address bar).
   ───────────────────────────────────────────── */

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
] as const;

let attribution: Record<string, string> | null = null;

export function getAttribution(): Record<string, string> {
  if (attribution) return attribution;
  const found: Record<string, string> = {};
  if (typeof window === "undefined") return found;
  const params = new URLSearchParams(window.location.search);
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) found[key] = value.slice(0, 200);
  }
  attribution = found;
  return found;
}

/** Only the utm_* part, which Calendly understands. */
export function getUtmParams(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(getAttribution()).filter(([key]) => key.startsWith("utm_")),
  );
}

/* ─────────────────────────────────────────────
   PAGE CONTEXT — same super-properties as the Nexora landings, so one
   PostHog project reads both: landing_slug is the page (home, ai, blog…).
   ───────────────────────────────────────────── */

export interface PageContext {
  landing_slug: string;
  variant: string;
}

export function pageContextFor(pathname: string): PageContext {
  const [, , page] = pathname.split("/");
  return { landing_slug: page || "home", variant: "default" };
}

export function getPageContext(): PageContext {
  return pageContextFor(
    typeof window === "undefined" ? "/" : window.location.pathname,
  );
}

function localeFromPath(): string {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/^\/(en|es)(\/|$)/);
  return match?.[1] ?? document.documentElement.lang ?? "";
}

/* ─────────────────────────────────────────────
   POSTHOG — loaded with a dynamic import to keep it out of the first
   bundle; calls made before it is ready are queued, not lost.
   ───────────────────────────────────────────── */

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
const queue: Array<(posthog: PostHog) => void> = [];

/** Starts PostHog once, on the client, when a key is configured. */
export function startPostHog(): boolean {
  if (typeof window === "undefined" || !POSTHOG_KEY) return false;
  if (!loading) {
    loading = import("posthog-js")
      .then(({ default: posthog }) => {
        const consented = getConsent() === "granted";
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          ui_host: posthogUiHost(POSTHOG_HOST),
          person_profiles: "identified_only",
          // <PageViews /> captures $pageview on every route change;
          // $pageleave carries scroll depth.
          capture_pageview: false,
          capture_pageleave: true,
          autocapture: true,
          rageclick: true,
          capture_dead_clicks: true,
          enable_heatmaps: true,
          // Until the visitor accepts: an in-memory id per page load, no
          // cookies, no storage.
          persistence: consented ? "localStorage+cookie" : "memory",
          disable_session_recording: !consented,
          session_recording: { maskAllInputs: true },
        });
        // utm_* / gclid / fbclid from the landing URL are registered for the
        // session by PostHog itself.
        posthog.register({ site: ANALYTICS_SITE, ...getPageContext() });
        client = posthog;
        queue.splice(0).forEach((run) => run(posthog));
        return posthog;
      })
      .catch(() => null);
  }
  return true;
}

function withPostHog(run: (posthog: PostHog) => void) {
  if (client) run(client);
  else if (startPostHog()) queue.push(run);
}

export function applyAnalyticsConsent(choice: ConsentChoice) {
  withPostHog((posthog) => {
    if (choice === "granted") {
      posthog.set_config({ persistence: "localStorage+cookie" });
      posthog.startSessionRecording();
    } else {
      posthog.stopSessionRecording();
      posthog.set_config({ persistence: "memory" });
    }
  });
}

/** Refreshes the super-properties every event carries (before each $pageview). */
export function registerPageContext() {
  const properties = { ...getPageContext(), locale: localeFromPath() };
  withPostHog((posthog) => posthog.register(properties));
}

export function track(event: string, properties?: EventProperties) {
  withPostHog((posthog) => posthog.capture(event, properties));
}

/**
 * Removes identifiers left by an earlier "Accept" (PostHog, Meta, Google,
 * Sentry replay) after the visitor withdraws consent. The caller reloads the
 * page so the ad scripts are gone too.
 */
export function clearTrackingStorage() {
  const isTracker = (name: string) =>
    name.startsWith("ph_") ||
    name.startsWith("__ph") ||
    name.startsWith("sentryReplay") ||
    name === "_fbp" ||
    name === "_fbc" ||
    name.startsWith("_gcl");
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      Object.keys(storage)
        .filter(isTracker)
        .forEach((key) => storage.removeItem(key));
    } catch {
      // Storage unavailable: nothing was stored there either.
    }
  }
  const host = window.location.hostname;
  const domains = ["", host, `.${host.split(".").slice(-2).join(".")}`];
  document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0].trim())
    .filter(isTracker)
    .forEach((name) => {
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
      }
    });
}
