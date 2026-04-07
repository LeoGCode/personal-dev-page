import { type Page, expect } from "@playwright/test";

/**
 * Wait for Next.js hydration to complete.
 */
export async function waitForHydration(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  // Use a short timeout for networkidle — analytics scripts (PostHog) can
  // keep connections open indefinitely and block this forever.
  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => {});
}

/**
 * Navigate to a locale-prefixed path.
 */
export async function goTo(page: Page, path: string, locale = "en") {
  const prefixed = path === "/" ? `/${locale}` : `/${locale}${path}`;
  await page.goto(prefixed);
  await waitForHydration(page);
}

/**
 * Assert that a heading with the given text is visible.
 */
export async function expectHeading(page: Page, text: string | RegExp) {
  await expect(page.getByRole("heading", { name: text }).first()).toBeVisible();
}

/**
 * Fill a form field by its label.
 */
export async function fillField(page: Page, label: string, value: string) {
  await page.getByLabel(label).fill(value);
}

/**
 * Click a link or button by its visible text.
 */
export async function clickByText(page: Page, text: string) {
  await page
    .getByRole("link", { name: text })
    .or(page.getByRole("button", { name: text }))
    .first()
    .click();
}
