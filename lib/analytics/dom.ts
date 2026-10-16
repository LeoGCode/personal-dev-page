import { trackAdConversion } from "@/lib/analytics/ads";
import {
  isCalendlyUrl,
  loadCalendly,
  openBooking,
  parseCalendlyMessage,
} from "@/lib/analytics/calendly";
import { getAttribution, getPageContext, track } from "@/lib/analytics/track";

/**
 * Document-level tracking, so every theme gets it without wiring each button:
 * CTA / package / WhatsApp / outbound clicks, FAQ opens, sections seen, Calendly bookings.
 *
 * Markup hooks (all optional):
 * - data-section="hero"           names a section (otherwise the <section id> is used)
 * - data-cta="hero"               marks a CTA and names where it sits
 * - data-cta-target="form"        CTA that leads to the contact form
 * - data-package / data-package-group / data-package-price   on a package card
 */

export type CtaTarget = "calendly" | "whatsapp" | "form" | "email";
export type LinkKind = CtaTarget | "outbound" | "internal" | "other";

const FORM_HASHES = new Set(["#contact", "#name"]);
/** The contact form page (/en/collaborate, /es/collaborate?type=ai_setup…). */
const FORM_PATH = /^\/(en|es)\/collaborate\/?$/;

export function classifyLink(
  href: string,
  base: string,
  ctaTarget?: string | null,
): LinkKind {
  if (ctaTarget === "form") return "form";
  let url: URL;
  try {
    url = new URL(href, base);
  } catch {
    return "other";
  }
  if (url.protocol === "mailto:") return "email";
  if (url.protocol === "whatsapp:") return "whatsapp";
  if (url.protocol !== "http:" && url.protocol !== "https:") return "other";
  const host = url.hostname.replace(/^www\./, "");
  if (host === "wa.me" || host.endsWith("whatsapp.com")) return "whatsapp";
  if (isCalendlyUrl(url.href)) return "calendly";
  const current = new URL(base);
  if (url.host !== current.host) return "outbound";
  if (FORM_HASHES.has(url.hash) || FORM_PATH.test(url.pathname)) return "form";
  return "internal";
}

export function sectionName(element: Element | null): string | null {
  const section = element?.closest<HTMLElement>("[data-section], section[id]");
  if (!section) return null;
  return section.dataset.section ?? section.id ?? null;
}

function ctaLocation(element: HTMLElement): string {
  const explicit = element.closest<HTMLElement>("[data-cta]")?.dataset.cta;
  if (explicit) return explicit;
  if (element.closest("nav, header")) return "nav";
  return (
    sectionName(element) ?? (element.closest("footer") ? "footer" : "page")
  );
}

function label(element: HTMLElement): string {
  return (element.getAttribute("aria-label") || element.textContent || "")
    .trim()
    .slice(0, 80);
}

function isPlainClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function onClick(event: MouseEvent) {
  const element = (event.target as Element | null)?.closest<HTMLElement>(
    "a[href], [data-cta]",
  );
  if (!element) return;

  const href = element instanceof HTMLAnchorElement ? element.href : "";
  const kind = classifyLink(
    href,
    window.location.href,
    element.dataset.ctaTarget,
  );
  const location = ctaLocation(element);
  const context = getPageContext();

  const pkg = element.closest<HTMLElement>("[data-package]");
  if (pkg) {
    track("package_clicked", {
      package: pkg.dataset.package,
      package_group: pkg.dataset.packageGroup,
      price: pkg.dataset.packagePrice,
      location,
      ...context,
    });
  }

  if (
    kind === "calendly" ||
    kind === "whatsapp" ||
    kind === "form" ||
    kind === "email"
  ) {
    track("cta_clicked", {
      location,
      target: kind,
      label: label(element),
      ...context,
    });
  } else if (element.dataset.cta) {
    track("cta_clicked", {
      location,
      target: "other",
      label: label(element),
      ...context,
    });
  }

  if (kind === "whatsapp") {
    track("whatsapp_clicked", { location, ...context });
    trackAdConversion("contact");
  }

  if (kind === "outbound") {
    const url = new URL(href);
    track("outbound_clicked", {
      url: `${url.origin}${url.pathname}`,
      host: url.hostname,
      label: label(element),
      location,
    });
  }

  if (kind === "calendly" && isPlainClick(event) && !event.defaultPrevented) {
    event.preventDefault();
    void openBooking(href).then((mode) => {
      track("booking_opened", { mode, location, ...context });
    });
  }
}

/** Starts loading the Calendly widget as soon as the visitor shows intent (hover, focus, touch). */
function onIntent(event: Event) {
  const anchor = (event.target as Element | null)?.closest?.<HTMLAnchorElement>(
    "a[href]",
  );
  if (anchor && isCalendlyUrl(anchor.href)) loadCalendly().catch(() => {});
}

function onToggle(event: Event) {
  const details = event.target;
  if (!(details instanceof HTMLDetailsElement) || !details.open) return;
  // The question without decorative icons (aria-hidden "+", chevrons).
  const summary = details.querySelector("summary")?.cloneNode(true) as
    | HTMLElement
    | undefined;
  summary
    ?.querySelectorAll("[aria-hidden='true']")
    .forEach((icon) => icon.remove());
  const question = summary?.textContent?.trim().slice(0, 140) ?? "";
  const siblings = details.parentElement
    ? Array.from(details.parentElement.querySelectorAll(":scope > details"))
    : [details];
  track("faq_opened", {
    question,
    index: siblings.indexOf(details),
    location: sectionName(details) ?? "page",
    ...getPageContext(),
  });
}

function onMessage(event: MessageEvent) {
  const message = parseCalendlyMessage(event);
  if (!message) return;
  const context = getPageContext();
  switch (message.event) {
    case "calendly.event_type_viewed":
    case "calendly.date_and_time_selected":
      track("booking_step", {
        step: message.event.replace("calendly.", ""),
        ...context,
      });
      break;
    case "calendly.event_scheduled": {
      const invitee = message.payload?.invitee?.uri ?? "";
      track("booking_scheduled", {
        calendly_event: message.payload?.event?.uri,
        calendly_invitee: invitee,
        ...context,
        ...getAttribution(),
      });
      trackAdConversion("booking", invitee.split("/").pop() || undefined);
      break;
    }
  }
}

export function installInteractionTracking(): () => void {
  const intentOptions = { capture: true, passive: true } as const;
  // Capture phase: still sees clicks that a component stops from bubbling.
  document.addEventListener("click", onClick, true);
  document.addEventListener("toggle", onToggle, true);
  document.addEventListener("pointerover", onIntent, intentOptions);
  document.addEventListener("focusin", onIntent, intentOptions);
  document.addEventListener("touchstart", onIntent, intentOptions);
  window.addEventListener("message", onMessage);
  return () => {
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("toggle", onToggle, true);
    document.removeEventListener("pointerover", onIntent, intentOptions);
    document.removeEventListener("focusin", onIntent, intentOptions);
    document.removeEventListener("touchstart", onIntent, intentOptions);
    window.removeEventListener("message", onMessage);
  };
}

/* ─────────────────────────────────────────────
   SECTIONS — "where attention goes"
   ───────────────────────────────────────────── */

/** A section counts as seen after it fills half the screen (or shows half of itself) for 1 s. */
const DWELL_MS = 1000;
const VISIBLE_SHARE = 0.5;

function collectSections(fallback: boolean): Array<[HTMLElement, string]> {
  const named = Array.from(
    document.querySelectorAll<HTMLElement>("[data-section]"),
  );
  if (named.length) return named.map((el) => [el, el.dataset.section!]);
  if (!fallback) return [];
  // Themes without explicit names: the first section is the hero, the rest go by their id.
  return Array.from(document.querySelectorAll<HTMLElement>("main section"))
    .map((el, i): [HTMLElement, string] => [
      el,
      el.id || (i === 0 ? "hero" : ""),
    ])
    .filter(([, name]) => name !== "");
}

export function observeSections({
  fallback,
}: {
  fallback: boolean;
}): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};
  const sections = collectSections(fallback);
  if (!sections.length) return () => {};

  const names = new Map(sections);
  const order = sections.map(([, name]) => name);
  const timers = new Map<Element, number>();
  const startedAt = performance.now();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const visible =
          entry.intersectionRect.height /
          Math.max(
            1,
            Math.min(entry.boundingClientRect.height, window.innerHeight),
          );
        if (entry.isIntersecting && visible >= VISIBLE_SHARE) {
          if (timers.has(element)) continue;
          const name = names.get(element)!;
          const timer = window.setTimeout(() => {
            observer.unobserve(element);
            timers.delete(element);
            track("section_viewed", {
              section: name,
              section_index: order.indexOf(name),
              seconds_since_load: Math.round(
                (performance.now() - startedAt) / 1000,
              ),
              ...getPageContext(),
            });
          }, DWELL_MS);
          timers.set(element, timer);
        } else if (timers.has(element)) {
          window.clearTimeout(timers.get(element));
          timers.delete(element);
        }
      }
    },
    { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
  );

  sections.forEach(([element]) => observer.observe(element));
  return () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    observer.disconnect();
  };
}
