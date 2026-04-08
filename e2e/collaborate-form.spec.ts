import { test, expect } from "@playwright/test";
import { goTo } from "./fixtures/test-helpers";

test.describe("Collaborate Form", () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, "/collaborate");
  });

  test("renders form with all required fields", async ({ page }) => {
    // Labels from en.json: "Your Name", "Email", "Tell me about your project"
    await expect(page.getByLabel(/your name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByLabel(/tell me about/i)).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: /send message/i }).click();

    // Should show validation errors for required fields
    await expect(page.getByText(/required|at least/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("submits form successfully", async ({ page }) => {
    // Mock the API endpoint
    await page.route("**/api/collaborate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Fill required fields
    await page.getByLabel(/your name/i).fill("Test User");
    await page.getByLabel(/email/i).first().fill("test@example.com");

    // Select collaboration type — Radix Select renders as combobox
    await page.getByRole("combobox").first().click();
    await page
      .getByRole("option", { name: /project/i })
      .first()
      .click();

    // Fill description
    await page
      .getByLabel(/tell me about/i)
      .fill(
        "This is a test submission with enough characters to pass validation.",
      );

    await page.getByRole("button", { name: /send message/i }).click();

    // Wait for success state
    await expect(page.getByText(/message sent/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("renders form in Spanish locale", async ({ page }) => {
    await goTo(page, "/collaborate", "es");

    // Spanish labels: "Tu Nombre", "Correo electrónico"
    await expect(page.getByLabel(/nombre/i).first()).toBeVisible();
    await expect(page.getByLabel(/correo/i).first()).toBeVisible();
  });
});
