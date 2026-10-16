import {
  GOOGLE_ADS_BOOKING_LABEL,
  GOOGLE_ADS_ID,
  GOOGLE_ADS_LEAD_LABEL,
  META_PIXEL_ID,
} from "@/lib/analytics/config";

/**
 * Meta pixel and Google Ads tag. Loaded only after the visitor accepts cookies, and only for the
 * ids that are configured; every function here is a no-op otherwise.
 */

type Queue = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Queue;
    _fbq?: Queue;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type Conversion = "booking" | "lead" | "contact";

/** Scripts injected (once per page; a script cannot be unloaded, only told to stop). */
let loaded = false;
/** Whether the tags may send anything: true after Accept, false again after a withdrawal. */
let active = false;

function injectScript(src: string) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function loadMetaPixel(pixelId: string) {
  if (window.fbq) return;
  // Meta's standard base code, without the inline <script> tag.
  const fbq: Queue = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  injectScript("https://connect.facebook.net/en_US/fbevents.js");
  fbq("consent", "grant");
  fbq("init", pixelId);
  fbq("track", "PageView");
}

const GRANTED = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
} as const;

const DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;

/** Google's documented per-tag kill switch, `window["ga-disable-AW-…"]`. */
function setGoogleDisabled(adsId: string, disabled: boolean) {
  (window as unknown as Record<string, boolean>)[`ga-disable-${adsId}`] =
    disabled;
}

function loadGoogleTag(adsId: string) {
  if (window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js reads the `arguments` object itself, not an array copy.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  // Loaded only after an explicit Accept, so consent mode starts granted.
  window.gtag("consent", "default", GRANTED);
  window.gtag("js", new Date());
  window.gtag("config", adsId);
  injectScript(
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(adsId)}`,
  );
}

/** After Accept (in this tab or another): load the tags, or switch them back on. */
export function loadAdTags() {
  if (typeof window === "undefined" || active) return;
  active = true;
  if (GOOGLE_ADS_ID) setGoogleDisabled(GOOGLE_ADS_ID, false);
  if (loaded) {
    window.fbq?.("consent", "grant");
    window.gtag?.("consent", "update", GRANTED);
    return;
  }
  loaded = true;
  if (META_PIXEL_ID) loadMetaPixel(META_PIXEL_ID);
  if (GOOGLE_ADS_ID) loadGoogleTag(GOOGLE_ADS_ID);
}

/**
 * Consent withdrawn (in this tab or another): stop both tags at once. The scripts stay in memory
 * until the page reloads, so they are told to stop: Meta `consent revoke`, Google consent mode
 * denied plus its `ga-disable-<id>` switch. Nothing here sends anything.
 */
export function revokeAdTags() {
  if (typeof window === "undefined" || !active) return;
  active = false;
  window.fbq?.("consent", "revoke");
  window.gtag?.("consent", "update", DENIED);
  if (GOOGLE_ADS_ID) setGoogleDisabled(GOOGLE_ADS_ID, true);
}

export function adTagsLoaded() {
  return loaded;
}

export function adTagsActive() {
  return active;
}

/** Client-side route change (the first page view is sent by the tags when they load). */
export function trackAdPageView() {
  if (!active) return;
  window.fbq?.("track", "PageView");
  if (GOOGLE_ADS_ID)
    window.gtag?.("event", "page_view", { send_to: GOOGLE_ADS_ID });
}

const META_EVENTS: Record<Conversion, string> = {
  booking: "Schedule",
  lead: "Lead",
  contact: "Contact",
};

const GOOGLE_LABELS: Partial<Record<Conversion, string>> = {
  booking: GOOGLE_ADS_BOOKING_LABEL,
  lead: GOOGLE_ADS_LEAD_LABEL,
};

/**
 * Sends a conversion to Meta (Schedule / Lead / Contact) and, for bookings and leads, to the
 * matching Google Ads conversion action. `dedupeId` (the booking id for bookings, required there)
 * goes out as Meta's eventID and Google's transaction_id, so both platforms drop duplicates.
 */
export function trackAdConversion(kind: Conversion, dedupeId?: string) {
  if (!active) return;
  if (kind === "booking" && !dedupeId) return;
  window.fbq?.(
    "track",
    META_EVENTS[kind],
    {},
    dedupeId ? { eventID: dedupeId } : undefined,
  );
  const label = GOOGLE_LABELS[kind];
  if (GOOGLE_ADS_ID && label) {
    window.gtag?.("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${label}`,
      ...(dedupeId && { transaction_id: dedupeId }),
    });
  }
}
