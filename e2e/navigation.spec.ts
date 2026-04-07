import { test, expect } from "@playwright/test";
import { goTo, expectHeading, waitForHydration } from "./fixtures/test-helpers";

test.describe("Navigation", () => {
  test("navigates to projects page", async ({ page }) => {
    await goTo(page, "/");

    await page
      .getByRole("navigation")
      .getByRole("link", { name: /projects/i })
      .click();
    await waitForHydration(page);

    await expect(page).toHaveURL(/\/en\/projects/);
    await expectHeading(page, /projects/i);
  });

  test("navigates to blog page", async ({ page }) => {
    await goTo(page, "/");

    await page
      .getByRole("navigation")
      .getByRole("link", { name: /blog/i })
      .click();
    await waitForHydration(page);

    await expect(page).toHaveURL(/\/en\/blog/);
    await expectHeading(page, /blog/i);
  });

  test("navigates to collaborate page", async ({ page }) => {
    await goTo(page, "/");

    await page
      .getByRole("navigation")
      .getByRole("link", { name: /collaborate/i })
      .click();
    await waitForHydration(page);

    await expect(page).toHaveURL(/\/en\/collaborate/);
  });

  test("navigates back to home from projects", async ({ page }) => {
    await goTo(page, "/projects");

    await page.getByRole("link", { name: "Leonel" }).click();
    await waitForHydration(page);

    await expect(page).toHaveURL(/\/en$/);
  });
});
