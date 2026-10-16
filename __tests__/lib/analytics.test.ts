// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bookingUrl,
  isCalendlyUrl,
  parseCalendlyMessage,
} from "@/lib/analytics/calendly";
import { classifyLink, sectionName } from "@/lib/analytics/dom";
import {
  CONSENT_STORAGE_KEY,
  getConsent,
  getConsentSnapshot,
  reopenConsent,
  resetConsentCache,
  setConsent,
  subscribeConsent,
} from "@/lib/analytics/consent";
import {
  BEFORE_CHOICE,
  BEFORE_CHOICE_EVENTS,
  beforeChoiceAllows,
} from "@/lib/analytics/config";
import {
  sanitizeEvent,
  sanitizeHref,
  sanitizeProperties,
  sanitizeUrl,
} from "@/lib/analytics/sanitize";
import { adTagsLoaded, trackAdConversion } from "@/lib/analytics/ads";
import { pageContextFor } from "@/lib/analytics/track";

const PAGE = "https://www.leogcode.dev/en/ai?utm_campaign=behind";

describe("classifyLink", () => {
  it("recognises the CTA targets", () => {
    expect(classifyLink("https://calendly.com/leogcode-dev/30min", PAGE)).toBe(
      "calendly",
    );
    expect(classifyLink("https://wa.me/19453380177?text=hola", PAGE)).toBe(
      "whatsapp",
    );
    expect(classifyLink("mailto:hello@leogcode.dev", PAGE)).toBe("email");
    expect(classifyLink("/en/collaborate?type=ai_setup", PAGE)).toBe("form");
    expect(classifyLink("/es/collaborate", PAGE)).toBe("form");
  });

  it("separates outbound links from in-site navigation", () => {
    expect(classifyLink("https://exprime.nexoragroup.dev/en", PAGE)).toBe(
      "outbound",
    );
    expect(classifyLink("https://github.com/LeoGCode", PAGE)).toBe("outbound");
    expect(classifyLink("/en/projects", PAGE)).toBe("internal");
    expect(classifyLink("/resume.pdf", PAGE)).toBe("internal");
  });
});

describe("sectionName", () => {
  it("uses data-section first, then the section id", () => {
    document.body.innerHTML = `
      <section id="ai-cta" data-section="contact"><a id="a" href="#">x</a></section>
      <section id="pricing"><a id="b" href="#">y</a></section>
      <div><a id="c" href="#">z</a></div>`;
    expect(sectionName(document.getElementById("a"))).toBe("contact");
    expect(sectionName(document.getElementById("b"))).toBe("pricing");
    expect(sectionName(document.getElementById("c"))).toBeNull();
  });
});

describe("pageContextFor", () => {
  it("uses the page as landing_slug, like the Nexora landings", () => {
    expect(pageContextFor("/en")).toEqual({
      landing_slug: "home",
      variant: "default",
    });
    expect(pageContextFor("/es/ai").landing_slug).toBe("ai");
    expect(pageContextFor("/en/blog/some-post").landing_slug).toBe("blog");
  });
});

describe("Calendly", () => {
  it("only treats calendly.com booking pages as Calendly", () => {
    expect(isCalendlyUrl("https://calendly.com/leogcode-dev/30min")).toBe(true);
    expect(
      isCalendlyUrl("https://assets.calendly.com/assets/external/widget.js"),
    ).toBe(false);
  });

  it("passes the visitor's UTMs to the booking", () => {
    const url = new URL(
      bookingUrl("https://calendly.com/leogcode-dev/30min", {
        utm_source: "facebook",
        utm_campaign: "paying",
        utm_content: "video-a",
      }),
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      utm_source: "facebook",
      utm_campaign: "paying",
      utm_content: "video-a",
    });
  });

  it("accepts only calendly.com messages with a calendly.* event", () => {
    const data = { event: "calendly.event_scheduled" };
    expect(
      parseCalendlyMessage(
        new MessageEvent("message", { origin: "https://calendly.com", data }),
      ),
    ).toEqual(data);
    expect(
      parseCalendlyMessage(
        new MessageEvent("message", { origin: "https://leogcode.dev", data }),
      ),
    ).toBeNull();
  });
});

describe("consent store", () => {
  afterEach(() => {
    window.localStorage.clear();
    resetConsentCache();
  });

  it("starts pending with the banner open", () => {
    expect(getConsent()).toBe("pending");
    expect(getConsentSnapshot().open).toBe(true);
  });

  it("remembers the choice and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeConsent(listener);
    setConsent("granted");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("granted");
    resetConsentCache();
    expect(getConsent()).toBe("granted");
    unsubscribe();
  });

  it("reopens the banner without dropping the stored choice", () => {
    setConsent("denied");
    reopenConsent();
    expect(getConsentSnapshot()).toMatchObject({
      choice: "denied",
      open: true,
    });
  });

  it("follows a choice made in another tab (storage event)", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeConsent(listener);
    setConsent("granted");
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: CONSENT_STORAGE_KEY,
        newValue: "denied",
      }),
    );
    expect(getConsentSnapshot()).toEqual({
      choice: "denied",
      open: false,
      origin: "other-tab",
    });
    window.dispatchEvent(
      new StorageEvent("storage", { key: "other", newValue: "granted" }),
    );
    expect(getConsent()).toBe("denied");
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});

describe("before a cookie choice", () => {
  it("counts anonymously and lets only the counting events through", () => {
    expect(BEFORE_CHOICE).toBe("anonymous_counts");
    for (const event of BEFORE_CHOICE_EVENTS) {
      expect(beforeChoiceAllows(event)).toBe(true);
    }
    for (const event of [
      "$autocapture",
      "$pageleave",
      "$snapshot",
      "section_viewed",
      "faq_opened",
      "outbound_clicked",
      "consent_chosen",
      "project_card_clicked",
    ]) {
      expect(beforeChoiceAllows(event)).toBe(false);
    }
    expect(beforeChoiceAllows("$pageview", "nothing")).toBe(false);
  });
});

describe("URL sanitizing", () => {
  const dirty =
    "https://www.leogcode.dev/en/ai?email=a%40b.c&utm_campaign=paying&fbclid=f#x";
  const clean = "https://www.leogcode.dev/en/ai?utm_campaign=paying&fbclid=f";

  it("keeps only the origin, the path and the campaign allowlist", () => {
    expect(sanitizeUrl(dirty)).toBe(clean);
    expect(sanitizeUrl("https://www.google.com/search?q=ana")).toBe(
      "https://www.google.com/search",
    );
    expect(sanitizeHref("#case")).toBe("#case");
    expect(sanitizeHref("/en/collaborate?type=ai_setup")).toBe(
      "/en/collaborate",
    );
  });

  it("covers SDK, person and replay properties, and manual events", () => {
    const event = sanitizeEvent({
      uuid: "1",
      event: "$pageview",
      properties: {
        $current_url: dirty,
        $referrer: "https://t.co/x?ref=me",
        ph_keyword: "private",
        wbraid: "w",
      },
      $set_once: { $initial_current_url: dirty },
    })!;
    expect(event.properties).toEqual({
      $current_url: clean,
      $referrer: "https://t.co/x",
    });
    expect(event.$set_once).toEqual({ $initial_current_url: clean });
    const replay = sanitizeEvent({
      uuid: "2",
      event: "$snapshot",
      properties: { $snapshot_data: [{ type: 4, data: { href: dirty } }] },
    })!;
    expect(replay.properties.$snapshot_data).toEqual([
      { type: 4, data: { href: clean } },
    ]);
    expect(sanitizeProperties({ url: dirty })).toEqual({ url: clean });
  });
});

describe("ad conversions", () => {
  it("do nothing before consent loads the tags", () => {
    expect(adTagsLoaded()).toBe(false);
    expect(() => trackAdConversion("lead")).not.toThrow();
    expect(window.fbq).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });
});
