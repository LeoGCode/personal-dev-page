import {
  test,
  expect,
  type BrowserContext,
  type Page,
  type Request,
} from "@playwright/test";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

/**
 * Cookie banner, every consent state, URL sanitizing, Calendly bookings and ad conversions on
 * /ai and /collaborate (same setup as the Nexora landings).
 *
 * Nothing leaves the machine: PostHog is answered by a local fake (it even serves posthog-js's own
 * recorder from node_modules, so session replay runs), the Meta pixel and Google tag scripts are
 * local stubs that record their calls, and Calendly is a local stub except in the last test.
 * Start the server with dummy ids, e.g. NEXT_PUBLIC_POSTHOG_KEY=phc_dummy,
 * NEXT_PUBLIC_META_PIXEL_ID=1, NEXT_PUBLIC_GOOGLE_ADS_ID=AW-1 (+ both labels). Tests that need a
 * piece the server was built without skip themselves.
 */

const CONSENT_KEY = "leogcode-consent-v1";
const AI_PAGE =
  "/en/ai?utm_source=facebook&utm_medium=paid&utm_campaign=paying";
/** Personal data in the query and fragment, plus a campaign key outside the allowlist. */
const DIRTY = `${AI_PAGE}&email=ana%40example.com&gbraid=zzz#contact-me`;
const DIRTY_REFERRER = "https://www.google.com/search?q=ana+lopez+email";
const AD_HOSTS =
  /facebook|googletagmanager|googleadservices|doubleclick|google\.com\/pagead/;
const BEFORE_CHOICE_EVENTS = new Set([
  "$pageview",
  "cta_clicked",
  "booking_opened",
  "booking_scheduled",
  "lead_form_viewed",
  "lead_form_submitted",
  "lead_form_success",
]);
const INVITEE =
  "https://api.calendly.com/scheduled_events/EVT12345678/invitees/INV12345678";

// Start without a stored choice (the config pre-sets one for the other specs).
test.use({ storageState: { cookies: [], origins: [] } });
// Several page loads, replay batches and timed waits per test.
test.describe.configure({ timeout: 90_000 });

test.beforeEach(async ({ context }) => {
  // posthog-js drops events from automated browsers (navigator.webdriver, HeadlessChrome brand).
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "webdriver", {
      get: () => false,
    });
    Object.defineProperty(Navigator.prototype, "userAgentData", {
      get: () => undefined,
    });
    // When this tab heard about a consent change made in another tab.
    addEventListener("storage", (event) => {
      if (event.key === "leogcode-consent-v1") {
        (
          window as unknown as { __consentSyncedAt?: number }
        ).__consentSyncedAt = Date.now();
      }
    });
    // When this tab wrote a choice (reported to the test, so it survives the reload).
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name: string, value: string) {
      setItem.call(this, name, value);
      if (name === "leogcode-consent-v1") {
        (
          window as unknown as {
            __consentWritten?: (v: string, t: number) => void;
          }
        ).__consentWritten?.(value, Date.now());
      }
    };
  });
});

/* ── fakes ─────────────────────────────────────────────────────────── */

/** When the page wrote each cookie choice (page clock), in order. */
async function consentWrites(context: BrowserContext) {
  const writes: Array<{ value: string; at: number }> = [];
  await context.exposeFunction(
    "__consentWritten",
    (value: string, at: number) => {
      writes.push({ value, at });
    },
  );
  return writes;
}

/** The moment the page stored `value` (fails the test if it never did). */
async function writtenAt(
  writes: Array<{ value: string; at: number }>,
  value: string,
) {
  await expect.poll(() => writes.some((w) => w.value === value)).toBe(true);
  return writes.filter((w) => w.value === value).at(-1)!.at;
}

interface CapturedEvent {
  event: string;
  properties: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
  timestamp?: string;
  /** When the request reached the fake PostHog. */
  at: number;
  /** When the browser captured the event (batches can leave a few seconds later). */
  captured: number;
  page: Page | null;
}

function decodeEvents(
  request: Request,
): Omit<CapturedEvent, "at" | "captured" | "page">[] {
  const raw = request.postDataBuffer();
  if (!raw) return [];
  let text: string;
  try {
    if (request.url().includes("compression=gzip"))
      text = gunzipSync(raw).toString("utf8");
    else {
      text = raw.toString("utf8");
      if (text.startsWith("data=")) {
        text = Buffer.from(
          decodeURIComponent(text.slice(5)),
          "base64",
        ).toString("utf8");
      }
    }
    const body = JSON.parse(text);
    const list = Array.isArray(body) ? body : (body.batch ?? [body]);
    return list.filter((e: CapturedEvent) => typeof e?.event === "string");
  } catch {
    return [];
  }
}

/** Capture time: `$time` on events; for replay batches, the newest recorded frame. */
function capturedAt(
  event: Omit<CapturedEvent, "at" | "captured" | "page">,
  fallback: number,
) {
  const frames = event.properties?.$snapshot_data;
  if (Array.isArray(frames) && frames.length) {
    return Math.max(
      ...frames.map((f: { timestamp?: number }) => f.timestamp ?? 0),
    );
  }
  const time = event.properties?.$time;
  return typeof time === "number" ? Math.round(time * 1000) : fallback;
}

interface PostHogLog {
  events: CapturedEvent[];
  /** Every request to PostHog, with its time, events or not (config, flags, recorder…). */
  requests: Array<{ url: string; at: number; page: Page | null }>;
}

const DIST = "node_modules/posthog-js/dist";

/** A local PostHog: remote config with replay on, the real recorder bundles, events recorded. */
async function fakePostHog(context: BrowserContext): Promise<PostHogLog> {
  const log: PostHogLog = { events: [], requests: [] };
  const remoteConfig = {
    sessionRecording: { endpoint: "/s/" },
    supportedCompression: ["gzip-js"],
  };
  await context.route(
    (url) => url.hostname.endsWith("posthog.com"),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      let page: Page | null = null;
      try {
        page = request.frame().page();
      } catch {
        // Not from a page (service worker): no page to attribute it to.
      }
      log.requests.push({ url: request.url(), at: Date.now(), page });
      const staticFile = url.pathname.match(/\/static\/([\w-]+\.js)$/);
      if (staticFile) {
        return route.fulfill({
          contentType: "application/javascript",
          body: readFileSync(`${DIST}/${staticFile[1]}`, "utf8"),
        });
      }
      const config = url.pathname.match(/\/array\/([^/]+)\/config(\.js)?$/);
      if (config?.[2]) {
        return route.fulfill({
          contentType: "application/javascript",
          body: `(window._POSTHOG_REMOTE_CONFIG=window._POSTHOG_REMOTE_CONFIG||{})[${JSON.stringify(config[1])}]={config:${JSON.stringify(remoteConfig)},siteApps:[]};`,
        });
      }
      if (config) return route.fulfill({ json: remoteConfig });
      if (url.pathname.startsWith("/flags"))
        return route.fulfill({ json: { featureFlags: {} } });
      const at = Date.now();
      log.events.push(
        ...decodeEvents(request).map((e) => ({
          ...e,
          at,
          captured: capturedAt(e, at),
          page,
        })),
      );
      return route.fulfill({ json: { status: 1 } });
    },
  );
  return log;
}

/** Meta pixel and Google tag stand-ins that record what the page asked them to do. */
async function fakeAdTags(context: BrowserContext) {
  const outside: string[] = [];
  await context.route("https://connect.facebook.net/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `(function(){var f=window.fbq;window.__fbq=[];f.callMethod=function(){window.__fbq.push(Array.prototype.slice.call(arguments))};(f.queue||[]).forEach(function(a){window.__fbq.push(Array.prototype.slice.call(a))});f.queue=[];})();`,
    }),
  );
  await context.route("https://www.googletagmanager.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.__gtagLoaded=true;",
    }),
  );
  await context.route(
    (url) =>
      AD_HOSTS.test(url.host + url.pathname) &&
      !/connect\.facebook\.net|googletagmanager/.test(url.host),
    (route) => {
      outside.push(route.request().url());
      return route.abort();
    },
  );
  return outside;
}

/** Calendly's widget and booking page, local: the page relays whatever the test asks it to post. */
async function fakeCalendly(context: BrowserContext) {
  const loads: string[] = [];
  await context.route("https://assets.calendly.com/**", (route) => {
    loads.push(route.request().url());
    if (route.request().url().endsWith(".css"))
      return route.fulfill({ body: "", contentType: "text/css" });
    return route.fulfill({
      contentType: "application/javascript",
      body: `window.Calendly={initPopupWidget:function(o){var d=document.createElement("div");d.className="calendly-overlay";var f=document.createElement("iframe");f.src=o.url;d.appendChild(f);document.body.appendChild(d);}};`,
    });
  });
  await context.route("https://calendly.com/**", (route) => {
    loads.push(route.request().url());
    return route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><script>addEventListener("message",function(e){if(e.data&&e.data.relay)parent.postMessage(e.data.relay,"*")})</script>`,
    });
  });
  return loads;
}

/** Makes the Calendly iframe on the page post `data` to the page, as Calendly's embed does. */
async function postFromCalendly(page: Page, data: unknown) {
  await expect
    .poll(() =>
      page.frames().some((f) => f.url().startsWith("https://calendly.com/")),
    )
    .toBe(true);
  await page
    .frames()
    .find((f) => f.url().startsWith("https://calendly.com/"))!
    .waitForLoadState();
  await page.evaluate((relay) => {
    const frame = document.querySelector<HTMLIFrameElement>(
      ".calendly-overlay iframe",
    );
    frame!.contentWindow!.postMessage({ relay }, "*");
  }, data);
}

async function adCalls(page: Page) {
  return page.evaluate(() => ({
    fbq: ((window as unknown as { __fbq?: unknown[][] }).__fbq ??
      []) as unknown[][],
    gtag: ((window.dataLayer ?? []) as IArguments[]).map((a) => Array.from(a)),
  }));
}

async function storedIds(page: Page) {
  return page.evaluate(() => ({
    local: Object.keys(localStorage).filter((k) => k !== "leogcode-consent-v1"),
    session: Object.keys(sessionStorage),
    cookies: document.cookie,
  }));
}

async function allowedOnly(log: PostHogLog) {
  const names = log.events.map((e) => e.event);
  expect(names.filter((name) => !BEFORE_CHOICE_EVENTS.has(name))).toEqual([]);
}

/** No URL anywhere in the payloads keeps personal query values, fragments or other params. */
function expectSanitized(log: PostHogLog) {
  const text = JSON.stringify(log.events);
  for (const leak of [
    "ana%40example.com",
    "ana@example.com",
    "gbraid",
    "contact-me",
    "q=ana",
  ]) {
    expect(text).not.toContain(leak);
  }
}

const bookingLink = (page: Page) =>
  page.locator('[data-section=hero] a[href^="https://calendly.com/"]').first();

const has = (log: PostHogLog, name: string) =>
  log.events.some((e) => e.event === name);

async function waitFor(log: PostHogLog, name: string, timeout = 15_000) {
  await expect.poll(() => has(log, name), { timeout }).toBe(true);
}

/** Lets the dwell timer of the hero and the "how" section run, and clicks a button. */
async function behave(page: Page) {
  await page.waitForTimeout(1500);
  await page.locator("[data-section=how]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator("[data-section=how]").click({ position: { x: 5, y: 5 } });
}

const posthogConfigured = (log: PostHogLog) => log.requests.length > 0;

/* ── banner ────────────────────────────────────────────────────────── */

test.describe("Cookie banner", () => {
  test("shows Accept and Reject side by side and remembers Reject", async ({
    page,
  }) => {
    await page.goto(AI_PAGE);
    const banner = page.getByTestId("consent-banner");
    await expect(banner).toBeVisible();
    const accept = banner.getByRole("button", { name: "Accept" });
    const reject = banner.getByRole("button", { name: "Reject" });
    const [a, r] = [await accept.boundingBox(), await reject.boundingBox()];
    expect(
      a &&
        r &&
        Math.abs(a.width - r.width) < 2 &&
        Math.abs(a.height - r.height) < 2,
    ).toBe(true);
    await expect(
      banner.getByRole("link", { name: "Privacy policy" }),
    ).toHaveAttribute("href", /\/en\/privacy$/);
    await reject.click();
    await expect(banner).toBeHidden();
    expect(
      await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY),
    ).toBe("denied");
    await page.reload();
    await expect(page.getByTestId("consent-banner")).toBeHidden();
  });

  test("the privacy page reopens the banner to change the choice", async ({
    page,
  }) => {
    await page.goto("/es/privacy");
    const banner = page.getByTestId("consent-banner");
    await banner.getByRole("button", { name: "Aceptar" }).click();
    await expect(banner).toBeHidden();
    await page
      .getByRole("main")
      .getByRole("button", { name: "Ajustes de cookies" })
      .click();
    await expect(banner).toBeVisible();
  });

  test("speaks Spanish on Spanish pages", async ({ page }) => {
    await page.goto("/es/ai");
    const banner = page.getByTestId("consent-banner");
    await expect(banner.getByRole("button", { name: "Aceptar" })).toBeVisible();
    await expect(
      banner.getByRole("button", { name: "Rechazar" }),
    ).toBeVisible();
  });
});

/* ── consent states ────────────────────────────────────────────────── */

test.describe("Consent states", () => {
  test("no choice: anonymous counts only, sanitized, nothing stored, no ads, no Calendly", async ({
    page,
    context,
  }) => {
    const log = await fakePostHog(context);
    const outside = await fakeAdTags(context);
    const calendly = await fakeCalendly(context);
    await page.goto(DIRTY, { referer: DIRTY_REFERRER });
    await expect(page.getByTestId("consent-banner")).toBeVisible();
    await waitFor(log, "$pageview").catch(() => {});
    test.skip(
      !posthogConfigured(log),
      "PostHog is not configured on this server",
    );

    const cta = bookingLink(page);
    await cta.hover();
    await cta.focus();
    await page.waitForTimeout(500);
    expect(calendly, "Calendly loads only on a booking click").toEqual([]);
    await behave(page);
    await cta.click();
    await waitFor(log, "booking_opened");

    await allowedOnly(log);
    for (const name of ["$pageview", "cta_clicked", "booking_opened"])
      expect(has(log, name)).toBe(true);
    for (const event of log.events) {
      expect(event.properties.distinct_id).toBe("$posthog_cookieless");
      expect(event.properties.$cookieless_mode).toBe(true);
      for (const key of ["$session_id", "$window_id", "$device_id"]) {
        expect(event.properties[key] ?? null).toBeNull();
      }
    }
    const pageview = log.events.find((e) => e.event === "$pageview")!;
    expect(pageview.properties).toMatchObject({
      site: "leogcode",
      landing_slug: "ai",
      locale: "en",
      utm_source: "facebook",
    });
    expect(pageview.properties.$current_url).toMatch(
      /\/en\/ai\?utm_source=facebook&utm_medium=paid&utm_campaign=paying$/,
    );
    expectSanitized(log);
    expect(await storedIds(page)).toEqual({
      local: [],
      session: [],
      cookies: "",
    });
    expect(await adCalls(page)).toEqual({ fbq: [], gtag: [] });
    expect(outside).toEqual([]);
  });

  test("Reject: nothing at all reaches PostHog, now or after a reload", async ({
    page,
    context,
  }) => {
    const writes = await consentWrites(context);
    const log = await fakePostHog(context);
    const outside = await fakeAdTags(context);
    await fakeCalendly(context);
    await page.goto(DIRTY);
    await waitFor(log, "$pageview").catch(() => {});
    test.skip(
      !posthogConfigured(log),
      "PostHog is not configured on this server",
    );
    await page.waitForTimeout(500);
    await page
      .getByTestId("consent-banner")
      .getByRole("button", { name: "Reject" })
      .click();

    const rejectedAt = await writtenAt(writes, "denied");
    await behave(page);
    await bookingLink(page).click();
    await expect(page.locator(".calendly-overlay iframe")).toBeVisible();
    await postFromCalendly(page, {
      event: "calendly.event_scheduled",
      payload: { invitee: { uri: INVITEE } },
    });
    await page.reload();
    await behave(page);
    await page.waitForTimeout(2000);

    // Nothing captured after the click, and no request at all once a request in flight landed.
    expect(
      log.events.filter((e) => e.captured >= rejectedAt).map((e) => e.event),
    ).toEqual([]);
    expect(log.requests.filter((r) => r.at >= rejectedAt + 1000)).toEqual([]);
    expect(await storedIds(page)).toEqual({
      local: [],
      session: [],
      cookies: "",
    });
    expect(await adCalls(page)).toEqual({ fbq: [], gtag: [] });
    expect(outside).toEqual([]);
  });

  test("Accept: full analytics, replay, ad tags, sanitized URLs", async ({
    page,
    context,
  }) => {
    const log = await fakePostHog(context);
    await fakeAdTags(context);
    await page.goto(DIRTY, { referer: DIRTY_REFERRER });
    await waitFor(log, "$pageview").catch(() => {});
    test.skip(
      !posthogConfigured(log),
      "PostHog is not configured on this server",
    );

    await page
      .getByTestId("consent-banner")
      .getByRole("button", { name: "Accept" })
      .click();
    await behave(page);
    await waitFor(log, "section_viewed");
    await waitFor(log, "$snapshot", 20_000);

    const main = log.events.filter(
      (e) => e.properties.distinct_id !== "$posthog_cookieless",
    );
    expect(main.map((e) => e.event)).toEqual(
      expect.arrayContaining(["consent_chosen", "section_viewed"]),
    );
    expect(
      main.find((e) => e.event === "consent_chosen")!.properties,
    ).toMatchObject({
      choice: "granted",
    });
    expectSanitized(log);
    // Replay meta events carry the page URL: sanitized too.
    const replayHrefs = log.events
      .filter((e) => e.event === "$snapshot")
      .flatMap(
        (e) =>
          (e.properties.$snapshot_data as Array<{
            type: number;
            data: { href?: string };
          }>) ?? [],
      )
      .filter((r) => r.type === 4)
      .map((r) => r.data.href);
    expect(replayHrefs.length).toBeGreaterThan(0);
    for (const href of replayHrefs) expect(href).not.toMatch(/email|gbraid|#/);

    const ids = await storedIds(page);
    expect(
      ids.local.some((k) => k.startsWith("ph_")) || ids.cookies.includes("ph_"),
    ).toBe(true);
    const ads = await adCalls(page);
    test.skip(
      ads.fbq.length === 0 && ads.gtag.length === 0,
      "No ad ids on this server",
    );
    expect(ads.fbq).toEqual(
      expect.arrayContaining([
        ["init", expect.any(String)],
        ["track", "PageView"],
      ]),
    );
  });

  test("withdraw: capture, replay and ad tags stop at once and the ids go", async ({
    page,
    context,
  }) => {
    const writes = await consentWrites(context);
    const log = await fakePostHog(context);
    const outside = await fakeAdTags(context);
    await page.goto(AI_PAGE);
    await waitFor(log, "$pageview").catch(() => {});
    test.skip(
      !posthogConfigured(log),
      "PostHog is not configured on this server",
    );
    await page
      .getByTestId("consent-banner")
      .getByRole("button", { name: "Accept" })
      .click();
    await behave(page);
    await waitFor(log, "$snapshot", 20_000);
    expect((await storedIds(page)).local.some((k) => k.startsWith("ph_"))).toBe(
      true,
    );

    await page.goto("/en/privacy");
    await page.waitForTimeout(1500);
    await page
      .getByRole("main")
      .getByRole("button", { name: "Cookie settings" })
      .click();
    await Promise.all([
      page.waitForEvent("load"),
      page
        .getByTestId("consent-banner")
        .getByRole("button", { name: "Reject" })
        .click(),
    ]);
    const withdrawnAt = await writtenAt(writes, "denied");
    await page.goto(AI_PAGE);
    await behave(page);
    await page.waitForTimeout(3000);

    // A batch captured before the click may still leave a moment later; nothing captured after.
    const after = log.events.filter((e) => e.captured >= withdrawnAt);
    expect(after.map((e) => e.event)).toEqual([]);
    expect(await storedIds(page)).toEqual({
      local: [],
      session: [],
      cookies: "",
    });
    expect(outside).toEqual([]);
  });

  test("two tabs follow each other: Accept, then withdraw", async ({
    context,
  }) => {
    const writes = await consentWrites(context);
    const log = await fakePostHog(context);
    await fakeAdTags(context);
    const [a, b] = [await context.newPage(), await context.newPage()];
    await a.goto(AI_PAGE);
    await b.goto(AI_PAGE);
    await waitFor(log, "$pageview").catch(() => {});
    test.skip(
      !posthogConfigured(log),
      "PostHog is not configured on this server",
    );

    // Accept in A: B hides its banner, starts full analytics, replay and the ad tags.
    await a
      .getByTestId("consent-banner")
      .getByRole("button", { name: "Accept" })
      .click();
    await expect(b.getByTestId("consent-banner")).toBeHidden();
    await b.bringToFront();
    await behave(b);
    await expect
      .poll(
        () =>
          log.events.some((e) => e.event === "section_viewed" && e.page === b),
        {
          timeout: 15_000,
        },
      )
      .toBe(true);
    await expect
      .poll(async () => (await adCalls(b)).fbq.length, { timeout: 10_000 })
      .toBeGreaterThan(0);

    // Withdraw in A: B stops at once, revokes its ad tags and never writes an id again.
    await a.goto("/en/privacy");
    await a.waitForTimeout(1500);
    await a
      .getByRole("main")
      .getByRole("button", { name: "Cookie settings" })
      .click();
    await a
      .getByTestId("consent-banner")
      .getByRole("button", { name: "Reject" })
      .click();
    const withdrawnAt = await writtenAt(writes, "denied");
    await b.waitForTimeout(500);
    await b.bringToFront();
    await b.locator("[data-section=packages]").scrollIntoViewIfNeeded();
    await b
      .locator("[data-section=packages]")
      .click({ position: { x: 5, y: 5 } });
    await b.waitForTimeout(1500);
    await b.locator("[data-section=hero]").scrollIntoViewIfNeeded();
    await b.waitForTimeout(3000);

    // B learns of it through the storage event, a few ms after the click in A; from then on it
    // captures nothing.
    const syncedAt = await b.evaluate(
      () =>
        (window as unknown as { __consentSyncedAt?: number })
          .__consentSyncedAt ?? 0,
    );
    expect(syncedAt - withdrawnAt).toBeGreaterThanOrEqual(0);
    expect(syncedAt - withdrawnAt).toBeLessThan(1000);
    const fromB = log.events.filter(
      (e) => e.page === b && e.captured >= syncedAt,
    );
    expect(fromB.map((e) => e.event)).toEqual([]);
    const ads = await adCalls(b);
    expect(ads.fbq).toContainEqual(["consent", "revoke"]);
    expect(ads.gtag).toContainEqual([
      "consent",
      "update",
      expect.objectContaining({
        ad_storage: "denied",
        analytics_storage: "denied",
      }),
    ]);
    expect(await storedIds(b)).toEqual({ local: [], session: [], cookies: "" });
  });

  test("two tabs: Reject in one stops the anonymous counts in the other", async ({
    context,
  }) => {
    const writes = await consentWrites(context);
    const log = await fakePostHog(context);
    await fakeCalendly(context);
    const [a, b] = [await context.newPage(), await context.newPage()];
    await a.goto(AI_PAGE);
    await b.goto(AI_PAGE);
    await waitFor(log, "$pageview").catch(() => {});
    test.skip(
      !posthogConfigured(log),
      "PostHog is not configured on this server",
    );
    await expect
      .poll(() => log.events.filter((e) => e.event === "$pageview").length, {
        timeout: 15_000,
      })
      .toBe(2);
    await a.waitForTimeout(500);
    await a
      .getByTestId("consent-banner")
      .getByRole("button", { name: "Reject" })
      .click();
    const rejectedAt = await writtenAt(writes, "denied");
    await expect(b.getByTestId("consent-banner")).toBeHidden();
    await b.bringToFront();
    await bookingLink(b).click();
    await b.waitForTimeout(2000);
    expect(
      log.events.filter((e) => e.captured >= rejectedAt).map((e) => e.event),
    ).toEqual([]);
    expect(log.requests.filter((r) => r.at >= rejectedAt + 1000)).toEqual([]);
  });
});

/* ── bookings and forms ────────────────────────────────────────────── */

test.describe("Bookings", () => {
  test("one booking id → one event and one conversion of each kind; no id → nothing", async ({
    page,
    context,
  }) => {
    const log = await fakePostHog(context);
    await fakeAdTags(context);
    await fakeCalendly(context);
    await page.goto(AI_PAGE);
    await waitFor(log, "$pageview").catch(() => {});
    test.skip(
      !posthogConfigured(log),
      "PostHog is not configured on this server",
    );
    await page
      .getByTestId("consent-banner")
      .getByRole("button", { name: "Accept" })
      .click();
    await bookingLink(page).click();
    await expect(page.locator(".calendly-overlay iframe")).toBeVisible();

    const booked = {
      event: "calendly.event_scheduled",
      payload: { invitee: { uri: INVITEE } },
    };
    await postFromCalendly(page, booked);
    await postFromCalendly(page, booked); // replayed
    await postFromCalendly(page, {
      event: "calendly.event_scheduled",
      payload: {},
    }); // no id
    await postFromCalendly(page, { event: "calendly.event_scheduled" }); // no payload
    // Same payload, but posted by the page itself instead of the Calendly iframe.
    await page.evaluate((data) => window.postMessage(data, "*"), booked);
    await waitFor(log, "booking_scheduled");
    // Long enough for any duplicate to arrive in a later batch.
    await page.waitForTimeout(4000);

    const bookings = log.events.filter((e) => e.event === "booking_scheduled");
    expect(bookings).toHaveLength(1);
    expect(bookings[0].properties).toMatchObject({
      booking_id: "INV12345678",
      utm_campaign: "paying",
    });
    const ads = await adCalls(page);
    test.skip(ads.fbq.length === 0, "No ad ids on this server");
    expect(ads.fbq.filter((c) => c[1] === "Schedule")).toEqual([
      ["track", "Schedule", {}, { eventID: "INV12345678" }],
    ]);
    const conversions = ads.gtag.filter(
      (c) => c[0] === "event" && c[1] === "conversion",
    );
    expect(conversions).toHaveLength(1);
    expect(conversions[0][2]).toMatchObject({ transaction_id: "INV12345678" });
  });

  test("before a choice a booking is counted once, anonymously, with no ad conversion", async ({
    page,
    context,
  }) => {
    const log = await fakePostHog(context);
    await fakeAdTags(context);
    await fakeCalendly(context);
    await page.goto(AI_PAGE);
    await waitFor(log, "$pageview").catch(() => {});
    test.skip(
      !posthogConfigured(log),
      "PostHog is not configured on this server",
    );
    await bookingLink(page).click();
    await expect(page.locator(".calendly-overlay iframe")).toBeVisible();
    const booked = {
      event: "calendly.event_scheduled",
      payload: { invitee: { uri: INVITEE } },
    };
    await postFromCalendly(page, booked);
    await postFromCalendly(page, booked);
    await page.waitForTimeout(2000);
    const bookings = log.events.filter((e) => e.event === "booking_scheduled");
    expect(bookings).toHaveLength(1);
    expect(bookings[0].properties.distinct_id).toBe("$posthog_cookieless");
    expect(await adCalls(page)).toEqual({ fbq: [], gtag: [] });
  });

  test("lead_form_viewed: only once the form is on screen, after the pageview", async ({
    page,
    context,
  }) => {
    const log = await fakePostHog(context);
    // A short window, so the form starts below the fold.
    await page.setViewportSize({ width: 1280, height: 300 });
    await page.goto("/en/collaborate");
    await waitFor(log, "$pageview").catch(() => {});
    test.skip(
      !posthogConfigured(log),
      "PostHog is not configured on this server",
    );
    await page.waitForTimeout(1500);
    expect(has(log, "lead_form_viewed")).toBe(false);

    await page.locator("form").first().scrollIntoViewIfNeeded();
    await waitFor(log, "lead_form_viewed");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator("form").first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const names = log.events.map((e) => e.event);
    expect(names.filter((n) => n === "lead_form_viewed")).toHaveLength(1);
    expect(names.indexOf("$pageview")).toBeLessThan(
      names.indexOf("lead_form_viewed"),
    );
  });

  test("the real Calendly popup opens with the visitor's UTMs", async ({
    page,
  }) => {
    await page.goto(AI_PAGE);
    await page
      .getByTestId("consent-banner")
      .getByRole("button", { name: "Reject" })
      .click();
    await bookingLink(page).click();
    const frame = page.locator(".calendly-overlay iframe");
    await expect(frame).toBeVisible({ timeout: 15_000 });
    const src = new URL((await frame.getAttribute("src"))!);
    expect(src.hostname).toBe("calendly.com");
    expect(src.pathname).toBe("/leogcode-dev/30min");
    expect(src.searchParams.get("utm_campaign")).toBe("paying");
    expect(src.searchParams.get("utm_source")).toBe("facebook");
    expect(page.url()).toContain("/en/ai");
  });
});
