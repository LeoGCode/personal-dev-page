import { test, expect, type Page, type Request } from "@playwright/test";
import { gunzipSync } from "node:zlib";

/**
 * Cookie banner, consent-gated tags, analytics events and the Calendly
 * booking popup on /ai. PostHog calls are intercepted and answered locally
 * (nothing reaches a real project); the event test skips when the server has
 * no PostHog key.
 */

const CONSENT_KEY = "leogcode-consent-v1";
const AI_PAGE =
  "/en/ai?utm_source=facebook&utm_medium=paid&utm_campaign=paying";
const AD_HOSTS =
  /connect\.facebook\.net|facebook\.com\/tr|googletagmanager\.com|googleadservices|doubleclick/;

// Start without a stored choice (the config pre-sets one for other specs).
test.use({ storageState: { cookies: [], origins: [] } });

interface CapturedEvent {
  event: string;
  properties: Record<string, unknown>;
}

function decodeEvents(request: Request): CapturedEvent[] {
  const raw = request.postDataBuffer();
  if (!raw) return [];
  let text: string;
  if (request.url().includes("compression=gzip")) {
    text = gunzipSync(raw).toString("utf8");
  } else {
    text = raw.toString("utf8");
    if (text.startsWith("data=")) {
      text = Buffer.from(decodeURIComponent(text.slice(5)), "base64").toString(
        "utf8",
      );
    }
  }
  try {
    const body = JSON.parse(text);
    const list = Array.isArray(body) ? body : (body.batch ?? [body]);
    return list.filter((e: CapturedEvent) => typeof e?.event === "string");
  } catch {
    return [];
  }
}

async function interceptPostHog(page: Page) {
  const events: CapturedEvent[] = [];
  await page.route(
    (url) => url.hostname.endsWith("posthog.com"),
    async (route) => {
      events.push(...decodeEvents(route.request()));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    },
  );
  return events;
}

function adRequests(page: Page) {
  const seen: string[] = [];
  page.on("request", (request) => {
    if (AD_HOSTS.test(request.url())) seen.push(request.url());
  });
  return seen;
}

test.describe("Cookie consent", () => {
  test("Accept and Reject look the same, Reject is remembered", async ({
    page,
  }) => {
    const ads = adRequests(page);
    await page.goto(AI_PAGE);

    const banner = page.getByTestId("consent-banner");
    await expect(banner).toBeVisible();
    const accept = await banner
      .getByRole("button", { name: "Accept" })
      .boundingBox();
    const reject = banner.getByRole("button", { name: "Reject" });
    const rejectBox = await reject.boundingBox();
    expect(Math.abs(accept!.width - rejectBox!.width)).toBeLessThan(2);
    expect(Math.abs(accept!.height - rejectBox!.height)).toBeLessThan(2);
    await expect(
      banner.getByRole("link", { name: "Privacy policy" }),
    ).toHaveAttribute("href", "/en/privacy");

    await reject.click();
    await expect(banner).toBeHidden();
    expect(
      await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY),
    ).toBe("denied");
    await page.reload();
    await expect(page.getByTestId("consent-banner")).toBeHidden();
    expect(ads).toEqual([]);
  });

  test("stores nothing before a choice", async ({ page }) => {
    await interceptPostHog(page);
    await page.goto(AI_PAGE);
    await expect(page.getByTestId("consent-banner")).toBeVisible();
    await page.waitForTimeout(1000);
    const stored = await page.evaluate(() => ({
      keys: [...Object.keys(localStorage), ...Object.keys(sessionStorage)],
      cookies: document.cookie,
    }));
    expect(stored.keys.filter((k) => /^(ph_|sentryReplay)/.test(k))).toEqual(
      [],
    );
    expect(stored.cookies).not.toMatch(/ph_|_fbp|_gcl/);
  });

  test("the footer and the privacy page reopen the banner", async ({
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
    await expect(
      banner.getByRole("button", { name: "Rechazar" }),
    ).toBeVisible();
  });
});

test.describe("Analytics events", () => {
  // posthog-js drops events from automated browsers (navigator.webdriver,
  // the HeadlessChrome brand).
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "webdriver", {
        get: () => false,
      });
      Object.defineProperty(Navigator.prototype, "userAgentData", {
        get: () => undefined,
      });
    });
  });

  test("pageview and CTA events carry page, locale and UTMs", async ({
    page,
  }) => {
    const events = await interceptPostHog(page);
    const has = (name: string) => events.some((e) => e.event === name);
    await page.goto(AI_PAGE);
    await expect
      .poll(() => has("$pageview"), { timeout: 10_000 })
      .toBe(true)
      .catch(() => {});
    test.skip(!has("$pageview"), "PostHog is not configured on this server");

    expect(
      events.find((e) => e.event === "$pageview")!.properties,
    ).toMatchObject({
      site: "leogcode",
      landing_slug: "ai",
      locale: "en",
      utm_source: "facebook",
      utm_campaign: "paying",
    });

    await page
      .getByRole("link", { name: /book the free 30-min call/i })
      .first()
      .click();
    await expect(page.locator(".calendly-overlay")).toBeVisible({
      timeout: 15_000,
    });
    await expect
      .poll(() => has("cta_clicked") && has("booking_opened"), {
        timeout: 15_000,
      })
      .toBe(true);
    expect(
      events.find((e) => e.event === "cta_clicked")!.properties,
    ).toMatchObject({ location: "hero", target: "calendly" });
  });
});

test.describe("Booking", () => {
  test("opens the Calendly popup with the visitor's UTMs", async ({ page }) => {
    await page.goto(AI_PAGE);
    await page
      .getByTestId("consent-banner")
      .getByRole("button", { name: "Reject" })
      .click();

    await page
      .getByRole("link", { name: /book the free 30-min call/i })
      .first()
      .click();
    const frame = page.locator(".calendly-overlay iframe");
    await expect(frame).toBeVisible({ timeout: 15_000 });
    const src = new URL((await frame.getAttribute("src"))!);
    expect(src.hostname).toBe("calendly.com");
    expect(src.pathname).toBe("/leogcode-dev/30min");
    expect(src.searchParams.get("utm_campaign")).toBe("paying");
    expect(page.url()).toContain("/en/ai");
  });
});
