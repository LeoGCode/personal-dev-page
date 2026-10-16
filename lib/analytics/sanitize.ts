import type { CaptureResult } from "posthog-js";

/**
 * URL sanitizing for everything PostHog sends: event properties ($current_url, $referrer,
 * $initial_*, $session_entry_*, $external_click_url, our own `url`…), person properties ($set,
 * $set_once), autocaptured link targets and session replay metadata. Query strings and fragments
 * can carry emails, names or tokens from a personalised link, so a URL keeps only its origin, its
 * path and the campaign parameters below.
 */

/** The only query parameters a URL keeps. Everything else, and every #fragment, is dropped. */
export const ALLOWED_QUERY_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

const ALLOWED = new Set<string>(ALLOWED_QUERY_PARAMS);
const ABSOLUTE_URL = /^https?:\/\//i;

/**
 * Campaign properties posthog-js reads from the URL besides the allowlist (gbraid, msclkid,
 * li_fat_id…). They are dropped like their query parameters, with their $initial_ and
 * $session_entry_ copies. `ph_keyword` is the search term from a search-engine referrer.
 */
const DROPPED_KEYS = new Set([
  "gad_source",
  "mc_cid",
  "gclsrc",
  "dclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "twclid",
  "li_fat_id",
  "igshid",
  "ttclid",
  "rdt_cid",
  "epik",
  "qclid",
  "sccid",
  "irclid",
  "_kx",
  "ph_keyword",
]);

function droppedKey(key: string): boolean {
  return DROPPED_KEYS.has(key.replace(/^\$(initial|session_entry)_/, ""));
}

function keepAllowedParams(url: URL): string {
  const kept = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (ALLOWED.has(key)) kept.append(key, value);
  });
  const query = kept.toString();
  return query ? `?${query}` : "";
}

/**
 * `https://host/path?email=a@b.c&utm_source=x#t` → `https://host/path?utm_source=x`.
 * Anything that is not an absolute http(s) URL comes back unchanged.
 */
export function sanitizeUrl(value: string): string {
  if (!ABSOLUTE_URL.test(value)) return value;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}${keepAllowedParams(url)}`;
  } catch {
    return value.replace(/[?#].*$/, "");
  }
}

/**
 * A link target as autocapture records it: absolute URLs and site paths are sanitized like
 * sanitizeUrl; in-page anchors (`#faq`), mailto: and tel: links are kept as written.
 */
export function sanitizeHref(href: string): string {
  if (ABSOLUTE_URL.test(href)) return sanitizeUrl(href);
  if (!href.startsWith("/")) return href;
  try {
    const url = new URL(href, "https://relative.invalid");
    return `${url.pathname}${keepAllowedParams(url)}`;
  } catch {
    return href.replace(/[?#].*$/, "");
  }
}

/**
 * Strings that are URLs are sanitized, and so are URL keys of nested objects: `$heatmap_data`
 * is keyed by the page URL. Nested values are followed a few levels down.
 */
function sanitizeValue(value: unknown, depth: number): unknown {
  if (typeof value === "string") return sanitizeUrl(value);
  if (depth <= 0 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value))
    return value.map((item) => sanitizeValue(item, depth - 1));
  const clean: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const cleanKey = sanitizeUrl(key);
    const cleanItem = sanitizeValue(item, depth - 1);
    const existing = clean[cleanKey];
    // Two URLs that differed only in a dropped parameter now share a key: keep both lists.
    clean[cleanKey] =
      Array.isArray(existing) && Array.isArray(cleanItem)
        ? [...existing, ...cleanItem]
        : cleanItem;
  }
  return clean;
}

/** Sanitizes every URL value (and URL key) and drops the non-allowlisted campaign keys. */
export function sanitizeProperties<T extends Record<string, unknown>>(
  properties: T,
): T {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (droppedKey(key)) continue;
    // Replay data and autocaptured elements have their own, narrower rules below.
    clean[key] =
      key === "$snapshot_data" || key === "$elements"
        ? value
        : sanitizeValue(value, 4);
  }
  return clean as T;
}

type ElementProps = Record<string, unknown> & { attr__href?: unknown };

function sanitizeElements(elements: unknown): unknown {
  if (!Array.isArray(elements)) return elements;
  return elements.map((element: ElementProps) =>
    element && typeof element.attr__href === "string"
      ? { ...element, attr__href: sanitizeHref(element.attr__href) }
      : element,
  );
}

function sanitizeElementsChain(chain: unknown): unknown {
  if (typeof chain !== "string") return chain;
  return chain.replace(
    /href="([^"]*)"/g,
    (_, href: string) => `href="${sanitizeHref(href)}"`,
  );
}

type ReplayEvent = {
  type?: number;
  data?: { href?: unknown; payload?: { href?: unknown } };
};

/** rrweb meta events (type 4) and PostHog's $pageview / $url_changed custom events (type 5). */
function sanitizeSnapshotData(data: unknown): unknown {
  if (!Array.isArray(data)) return data;
  return data.map((event: ReplayEvent) => {
    if (!event?.data) return event;
    if (typeof event.data.href === "string") {
      return {
        ...event,
        data: { ...event.data, href: sanitizeUrl(event.data.href) },
      };
    }
    const payload = event.data.payload;
    if (payload && typeof payload.href === "string") {
      return {
        ...event,
        data: {
          ...event.data,
          payload: { ...payload, href: sanitizeUrl(payload.href) },
        },
      };
    }
    return event;
  });
}

/** posthog-js `before_send` hook: runs on every event, including replay ($snapshot) batches. */
export function sanitizeEvent(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event) return event;
  const properties = sanitizeProperties(event.properties ?? {});
  if ("$elements" in properties)
    properties.$elements = sanitizeElements(properties.$elements);
  if ("$elements_chain" in properties) {
    properties.$elements_chain = sanitizeElementsChain(
      properties.$elements_chain,
    );
  }
  if ("$snapshot_data" in properties) {
    properties.$snapshot_data = sanitizeSnapshotData(properties.$snapshot_data);
  }
  return {
    ...event,
    properties,
    ...(event.$set && { $set: sanitizeProperties(event.$set) }),
    ...(event.$set_once && { $set_once: sanitizeProperties(event.$set_once) }),
  };
}

/**
 * Session replay `maskCapturedNetworkRequestFn`: posthog-js also passes the page URL of every
 * recording's meta event and $url_changed marker through it, before buffering.
 */
export function sanitizeNetworkRequest<T extends { name?: string }>(
  request: T,
): T {
  return typeof request.name === "string"
    ? { ...request, name: sanitizeUrl(request.name) }
    : request;
}
