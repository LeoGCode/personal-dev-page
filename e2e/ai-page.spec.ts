import { test, expect } from "@playwright/test";
import { goTo, waitForHydration } from "./fixtures/test-helpers";

const BOOKING_URL = "https://calendly.com/leogcode-dev/30min";

test.describe("AI setup page", () => {
  test("renders the offer with the booking CTA (EN)", async ({ page }) => {
    await goTo(page, "/ai");

    await expect(
      page.getByRole("heading", { level: 1, name: /already pay for/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /5 spots for people I know/i }),
    ).toBeVisible();

    const booking = page.getByRole("link", {
      name: /book the free 30-min call/i,
    });
    await expect(booking.first()).toHaveAttribute("href", BOOKING_URL);
  });

  test("renders in Spanish", async ({ page }) => {
    await goTo(page, "/ai", "es");

    await expect(
      page.getByRole("heading", { level: 1, name: /la IA que ya pagas/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /ver todos los paquetes/i }),
    ).toHaveAttribute("href", "https://exprime.nexoragroup.dev/es#packages");
  });

  test("redirects the short /ai link to a locale", async ({ page }) => {
    await page.goto("/ai");
    await expect(page).toHaveURL(/\/(en|es)\/ai$/);
  });

  test("has no horizontal scroll", async ({ page }) => {
    await goTo(page, "/ai");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("contact link opens the form with AI setup pre-selected", async ({
    page,
  }) => {
    await goTo(page, "/ai");

    await page.getByRole("link", { name: /send me a message/i }).click();
    await waitForHydration(page);

    await expect(page).toHaveURL(/\/en\/collaborate\?type=ai_setup$/);
    await expect(
      page.getByRole("combobox", { name: /what are you looking for/i }),
    ).toHaveText(/set up my ai/i);
  });

  test("is reachable from the main navigation", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop navigation only");
    await goTo(page, "/");

    await page
      .getByRole("navigation")
      .getByRole("link", { name: /ai setup/i })
      .click();
    await waitForHydration(page);

    await expect(page).toHaveURL(/\/en\/ai$/);
  });
});
