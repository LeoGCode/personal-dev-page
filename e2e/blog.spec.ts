import { test, expect } from "@playwright/test";
import { goTo, expectHeading, waitForHydration } from "./fixtures/test-helpers";

test.describe("Blog Page", () => {
  test("renders blog listing with posts", async ({ page }) => {
    await goTo(page, "/blog");

    await expectHeading(page, /blog/i);

    // Should display blog post links
    const postLinks = page.getByRole("link").filter({ hasText: /.{10,}/ });
    await expect(postLinks.first()).toBeVisible();
  });

  test("navigates to blog post detail", async ({ page }) => {
    await goTo(page, "/blog");

    // Click on the first blog post
    const firstPost = page
      .locator("a[href*='/blog/']")
      .filter({ hasNotText: /^blog$/i })
      .first();
    await firstPost.click();

    await waitForHydration(page);

    // Should be on a blog post page
    await expect(page).toHaveURL(/\/en\/blog\/.+/);
  });

  test("renders blog in Spanish", async ({ page }) => {
    await goTo(page, "/blog", "es");

    await expectHeading(page, /blog/i);
  });
});
