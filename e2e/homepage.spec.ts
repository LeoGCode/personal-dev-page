import { test, expect } from "@playwright/test";
import { goTo, waitForHydration } from "./fixtures/test-helpers";

test.describe("Homepage", () => {
  test("renders hero section with CTA buttons", async ({ page }) => {
    await goTo(page, "/");

    // Hero greeting text
    await expect(page.getByText(/Hi, I'm Leonel/i)).toBeVisible();

    // Hero heading
    await expect(
      page.getByRole("heading", { name: /Software Engineer/i }).first(),
    ).toBeVisible();

    // Primary CTA — "Let's Collaborate"
    const collaborateLink = page.getByRole("link", {
      name: /let's collaborate/i,
    });
    await expect(collaborateLink.first()).toBeVisible();

    // Secondary CTA — "View My Work"
    const viewWorkLink = page.getByRole("link", { name: /view my work/i });
    await expect(viewWorkLink.first()).toBeVisible();
  });

  test("renders navigation bar with links", async ({ page }) => {
    await goTo(page, "/");

    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();

    // Logo link
    await expect(page.getByRole("link", { name: "Leonel" })).toBeVisible();
  });

  test("renders footer with social links", async ({ page }) => {
    await goTo(page, "/");

    // Scope to the site footer (not Next.js error overlay footer)
    const footer = page.locator("footer").filter({ hasText: /nexora/i });
    await expect(footer).toBeVisible();

    // Social links
    await expect(footer.getByRole("link", { name: /github/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /linkedin/i })).toBeVisible();
  });

  test("switches locale from EN to ES", async ({ page }) => {
    await goTo(page, "/");

    // Click the locale switcher (desktop button showing "ES")
    const localeSwitcher = page
      .getByRole("navigation")
      .getByRole("button", { name: /ES/i });
    await localeSwitcher.click();

    await waitForHydration(page);

    // Should now be on the Spanish page
    await expect(page).toHaveURL(/\/es/);
  });
});
