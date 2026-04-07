import { test, expect } from "@playwright/test";
import { goTo, expectHeading, waitForHydration } from "./fixtures/test-helpers";

test.describe("Projects Page", () => {
  test("renders projects listing with cards", async ({ page }) => {
    await goTo(page, "/projects");

    await expectHeading(page, /projects/i);

    // Project cards are rendered as links with Card components inside
    const projectLinks = page.locator("a[href*='/projects/']");
    await expect(projectLinks.first()).toBeVisible();
  });

  test("navigates to project detail page", async ({ page }) => {
    await goTo(page, "/projects");

    // Click on the first project link
    const firstProject = page.locator("a[href*='/projects/']").first();
    await firstProject.click();

    await waitForHydration(page);

    // Should be on a project detail page
    await expect(page).toHaveURL(/\/en\/projects\/.+/);
  });

  test("renders projects in Spanish", async ({ page }) => {
    await goTo(page, "/projects", "es");

    await expectHeading(page, /proyectos/i);
  });
});
