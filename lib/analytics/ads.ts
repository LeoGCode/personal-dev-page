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

let loaded = false;

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
  fbq("init", pixelId);
  fbq("track", "PageView");
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
  window.gtag("consent", "default", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
  });
  window.gtag("js", new Date());
  window.gtag("config", adsId);
  injectScript(
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(adsId)}`,
  );
}

export function loadAdTags() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  if (META_PIXEL_ID) loadMetaPixel(META_PIXEL_ID);
  if (GOOGLE_ADS_ID) loadGoogleTag(GOOGLE_ADS_ID);
}

export function adTagsLoaded() {
  return loaded;
}

/** Client-side route change (the first page view is sent by the tags when they load). */
export function trackAdPageView() {
  if (!loaded) return;
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
 * matching Google Ads conversion action. `dedupeId` lets both platforms drop duplicates.
 */
export function trackAdConversion(kind: Conversion, dedupeId?: string) {
  if (!loaded) return;
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
