import type { CaptureResult, PostHog, PostHogConfig } from "posthog-js";
import {
  ANALYTICS_SITE,
  beforeChoiceAllows,
  POSTHOG_HOST,
  POSTHOG_KEY,
  posthogUiHost,
} from "@/lib/analytics/config";
import { getConsent, type ConsentChoice } from "@/lib/analytics/consent";
import {
  ALLOWED_QUERY_PARAMS,
  sanitizeEvent,
  sanitizeNetworkRequest,
  sanitizeProperties,
  sanitizeUrl,
} from "@/lib/analytics/sanitize";

export type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

/* ─────────────────────────────────────────────
   ATTRIBUTION — the ad click parameters of the landing URL, kept for the
   whole visit (client-side navigation drops them from the address bar).
   Same allowlist as URL sanitizing.
   ───────────────────────────────────────────── */

export const ATTRIBUTION_KEYS = ALLOWED_QUERY_PARAMS;

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
   POSTHOG — loaded with a dynamic import to keep it out of the first bundle;
   calls made before it is ready wait for it, in order. One instance per
   consent state, so nothing leaks from one into the other:
   - Accept: the main instance, with persistence, autocapture, heatmaps and
     replay (inputs masked);
   - no choice yet: what BEFORE_CHOICE (config.ts) allows, through a separate
     cookieless instance;
   - Reject: nothing is loaded and nothing is sent.
   Every event goes through sanitizeEvent (URLs) and a consent gate in
   `before_send`.
   ───────────────────────────────────────────── */

let sdk: Promise<PostHog | null> | null = null;
let main: PostHog | null = null;
let anonymous: PostHog | null = null;

function loadSdk(): Promise<PostHog | null> {
  sdk ??= import("posthog-js")
    .then(({ default: posthog }) => posthog)
    .catch(() => null);
  return sdk;
}

const keepIfGranted = (event: CaptureResult | null) =>
  getConsent() === "granted" ? event : null;

/** Before a choice only the allowed events, and nothing that could link them to a device. */
function keepIfAllowedBeforeChoice(
  event: CaptureResult | null,
): CaptureResult | null {
  if (
    !event ||
    getConsent() !== "pending" ||
    !beforeChoiceAllows(event.event)
  ) {
    return null;
  }
  const properties = { ...event.properties };
  for (const key of [
    "$session_id",
    "$window_id",
    "$device_id",
    "$pageview_id",
  ]) {
    delete properties[key];
  }
  return { ...event, properties };
}

/** The behaviour switches of the main instance, on after Accept and off after a withdrawal. */
function mainFeatures(on: boolean): Partial<PostHogConfig> {
  return {
    autocapture: on,
    rageclick: on,
    capture_dead_clicks: on,
    enable_heatmaps: on,
    capture_pageleave: on,
    disable_session_recording: !on,
    // Off: the ph_* cookie and localStorage entry are removed and never written again.
    disable_persistence: !on,
    // Off: no /flags request after the withdrawal (reset() would otherwise ask for one).
    advanced_disable_flags: !on,
  };
}

function startMain(posthog: PostHog): PostHog {
  if (main) return main;
  main = posthog;
  main.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: posthogUiHost(POSTHOG_HOST),
    person_profiles: "identified_only",
    // <PageViews /> captures $pageview on every route change; $pageleave
    // carries scroll depth.
    capture_pageview: false,
    persistence: "localStorage+cookie",
    cross_subdomain_cookie: false,
    session_recording: {
      maskAllInputs: true,
      maskCapturedNetworkRequestFn: sanitizeNetworkRequest,
    },
    before_send: [sanitizeEvent, keepIfGranted],
    ...mainFeatures(true),
  });
  main.register({
    site: ANALYTICS_SITE,
    ...getPageContext(),
    locale: localeFromPath(),
  });
  return main;
}

function startAnonymous(posthog: PostHog): PostHog {
  if (anonymous) return anonymous;
  anonymous = posthog.init(
    POSTHOG_KEY,
    {
      api_host: POSTHOG_HOST,
      // No cookie, no storage, no id on the device: PostHog hashes visitors
      // on its servers.
      cookieless_mode: "always",
      person_profiles: "never",
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      rageclick: false,
      capture_dead_clicks: false,
      enable_heatmaps: false,
      capture_performance: false,
      capture_exceptions: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_product_tours: true,
      disable_conversations: true,
      disable_web_experiments: true,
      advanced_disable_flags: true,
      // Each count goes out on its own right away: nothing is left queued
      // after a Reject.
      request_batching: false,
      before_send: [sanitizeEvent, keepIfAllowedBeforeChoice],
    },
    "anonymous",
  );
  anonymous.register({
    site: ANALYTICS_SITE,
    ...getPageContext(),
    locale: localeFromPath(),
  });
  return anonymous;
}

/**
 * Runs `run` on the instance an event goes to under the current choice
 * (started on first use), or does nothing when the choice allows none.
 */
function withClient(event: string, run: (client: PostHog) => void) {
  if (typeof window === "undefined" || !POSTHOG_KEY) return;
  const choice = getConsent();
  const target =
    choice === "granted"
      ? "main"
      : choice === "pending" && beforeChoiceAllows(event)
        ? "anonymous"
        : null;
  if (!target) return;
  void loadSdk().then((posthog) => {
    if (!posthog) return;
    run(target === "main" ? startMain(posthog) : startAnonymous(posthog));
  });
}

/**
 * Applies a consent change, in this tab or synced from another. Accept starts
 * the main instance and replay; Reject or a withdrawal stops capture and
 * replay at once and forgets the in-memory id, so an Accept later in this page
 * starts from a new one.
 */
export function applyAnalyticsConsent(choice: ConsentChoice) {
  if (typeof window === "undefined" || !POSTHOG_KEY) return;
  if (choice === "granted") {
    void loadSdk().then((posthog) => {
      // The choice may have changed while the SDK was loading.
      if (!posthog || getConsent() !== "granted") return;
      const client = startMain(posthog);
      client.set_config(mainFeatures(true));
      client.startSessionRecording();
    });
    return;
  }
  if (!main) return;
  // The consent gate already drops anything captured from here on.
  main.stopSessionRecording();
  main.set_config(mainFeatures(false));
  main.reset(true);
}

/** Refreshes the super-properties every event carries (before each $pageview). */
export function registerPageContext() {
  const properties = { ...getPageContext(), locale: localeFromPath() };
  main?.register(properties);
  anonymous?.register(properties);
}

/** Sends an event if the current cookie choice allows it; URL values are sanitized first. */
export function track(event: string, properties?: EventProperties) {
  const clean = properties ? sanitizeProperties(properties) : undefined;
  withClient(event, (client) => client.capture(event, clean));
}

/* ─────────────────────────────────────────────
   PAGE VIEWS — events that belong to a page (lead_form_viewed) wait for
   its $pageview
   ───────────────────────────────────────────── */

function pageKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

let pageviewSentFor: string | null = null;
let waiting: Array<{ key: string; run: () => void }> = [];

/** Sends the $pageview of the current URL (sanitized) after refreshing the page context. */
export function trackPageview() {
  registerPageContext();
  track("$pageview", { $current_url: sanitizeUrl(window.location.href) });
  pageviewSentFor = pageKey();
  const ready = waiting.filter((item) => item.key === pageviewSentFor);
  waiting = waiting.filter((item) => item.key !== pageviewSentFor);
  ready.forEach((item) => item.run());
}

/** Runs `run` once this page's $pageview is out (right away if it already is). */
export function afterPageview(run: () => void) {
  const key = pageKey();
  if (pageviewSentFor === key) run();
  else waiting.push({ key, run });
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
