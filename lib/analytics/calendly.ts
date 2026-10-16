import { getUtmParams } from "@/lib/analytics/track";

/**
 * Calendly's official popup widget. Booking links stay plain <a href> to Calendly (works without
 * JavaScript); on click the widget opens over the page instead, so the booking happens in an
 * embed that tells us when it is scheduled (window.postMessage). Nothing from Calendly loads
 * before that click: no preloading on hover, focus or touch.
 */

const WIDGET_JS = "https://assets.calendly.com/assets/external/widget.js";
const WIDGET_CSS = "https://assets.calendly.com/assets/external/widget.css";
export const CALENDLY_ORIGIN = "https://calendly.com";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
      closePopupWidget?: () => void;
    };
  }
}

export function isCalendlyUrl(href: string): boolean {
  try {
    const { protocol, hostname } = new URL(href);
    return protocol === "https:" && hostname === "calendly.com";
  } catch {
    return false;
  }
}

/** The booking URL with the visitor's utm_* attached, so Calendly stores them on the booking. */
export function bookingUrl(
  href: string,
  utm: Record<string, string> = getUtmParams(),
): string {
  const url = new URL(href);
  for (const [key, value] of Object.entries(utm)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return url.toString();
}

let loading: Promise<void> | null = null;

/** Loads the widget once. Rejects after `timeoutMs` so the caller can fall back to the link. */
export function loadCalendly(timeoutMs = 5000): Promise<void> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("no window"));
  if (window.Calendly) return Promise.resolve();
  if (!loading) {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = WIDGET_CSS;
    document.head.appendChild(css);

    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = WIDGET_JS;
      script.async = true;
      script.onload = () =>
        window.Calendly ? resolve() : reject(new Error("no Calendly"));
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error("widget failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  const pending = loading;
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("widget timed out")),
      timeoutMs,
    );
    pending.then(
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Opens the booking popup; if the widget cannot load (blocked, offline), opens the plain link.
 * Returns how it was opened.
 */
export async function openBooking(href: string): Promise<"popup" | "link"> {
  const url = bookingUrl(href);
  try {
    await loadCalendly();
    window.Calendly!.initPopupWidget({ url });
    return "popup";
  } catch {
    const tab = window.open(url, "_blank");
    if (tab) tab.opener = null;
    else window.location.assign(url);
    return "link";
  }
}

export interface CalendlyMessage {
  event: string;
  payload?: {
    event?: { uri?: unknown };
    invitee?: { uri?: unknown };
  };
}

/** Narrows a window message to a Calendly embed event. */
export function parseCalendlyMessage(
  event: MessageEvent,
): CalendlyMessage | null {
  if (event.origin !== CALENDLY_ORIGIN) return null;
  const data = event.data as Partial<CalendlyMessage> | null;
  if (
    !data ||
    typeof data.event !== "string" ||
    !data.event.startsWith("calendly.")
  )
    return null;
  return data as CalendlyMessage;
}

/** Whether a message came from a Calendly iframe that is on the page right now (our popup). */
export function isFromActiveEmbed(
  source: MessageEventSource | null,
  root: ParentNode = document,
): boolean {
  if (!source) return false;
  const frames = root.querySelectorAll<HTMLIFrameElement>("iframe");
  return Array.from(frames).some(
    (frame) => isCalendlyUrl(frame.src) && frame.contentWindow === source,
  );
}

/** `https://api.calendly.com/scheduled_events/<uuid>/invitees/<uuid>` → the last uuid. */
function calendlyUuid(uri: unknown): string | null {
  if (typeof uri !== "string") return null;
  try {
    const url = new URL(uri);
    if (url.protocol !== "https:" || !url.hostname.endsWith("calendly.com"))
      return null;
    const id = url.pathname.split("/").filter(Boolean).pop() ?? "";
    return /^[A-Za-z0-9_-]{8,64}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * The stable id of a scheduled booking: the invitee's uuid, else the event's. `null` when the
 * payload has neither, and then nothing is sent anywhere.
 */
export function bookingIdOf(message: CalendlyMessage): string | null {
  return (
    calendlyUuid(message.payload?.invitee?.uri) ??
    calendlyUuid(message.payload?.event?.uri)
  );
}

const processedBookings = new Set<string>();

/** True the first time a booking id is seen in this page; false for any replay of it. */
export function claimBooking(id: string): boolean {
  if (processedBookings.has(id)) return false;
  processedBookings.add(id);
  return true;
}

/** Test helper. */
export function resetProcessedBookings() {
  processedBookings.clear();
}
