import { defineConfig, devices } from "@playwright/test";

const RECORD_VIDEO = process.env.RECORD_VIDEO === "true";

// APP_PORT is set by scripts/ports.sh (sourced by pnpm scripts).
// Fallback to 3000 for direct invocation.
const APP_PORT = Number(process.env.APP_PORT || 3000);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${APP_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: RECORD_VIDEO
      ? { mode: "on", size: { width: 1920, height: 1080 } }
      : { mode: "retain-on-failure", size: { width: 1920, height: 1080 } },
  },

  projects: [
    {
      name: "desktop-chrome",
      testIgnore: ["**/full-showcase*", "**/odoo-crm*"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "mobile-iphone",
      testIgnore: ["**/full-showcase*", "**/odoo-crm*"],
      use: {
        ...devices["iPhone 14"],
        ...(RECORD_VIDEO && {
          video: {
            mode: "on" as const,
            size: { width: 390, height: 844 },
          },
        }),
      },
    },
    {
      name: "mobile-android",
      testIgnore: ["**/full-showcase*", "**/odoo-crm*"],
      use: {
        ...devices["Pixel 7"],
        ...(RECORD_VIDEO && {
          video: {
            mode: "on" as const,
            size: { width: 412, height: 915 },
          },
        }),
      },
    },
    // Showcase — full walkthrough of the site for video recording.
    // Requires: docker compose up mailpit
    // Run with: pnpm run e2e:showcase
    {
      name: "showcase",
      testMatch: ["**/full-showcase*"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        video: {
          mode: "on",
          size: { width: 1920, height: 1080 },
        },
      },
    },
    {
      name: "showcase-android",
      testMatch: ["**/full-showcase*"],
      use: {
        ...devices["Pixel 7"],
        video: {
          mode: "on",
          size: { width: 412, height: 915 },
        },
      },
    },
    // Odoo CRM — full lead lifecycle from form submission to CRM closure.
    // Requires: docker compose --profile odoo up (+ dev profile for the app)
    //           pnpm run odoo:init  (first time only)
    // Run with: pnpm run e2e:odoo
    {
      name: "odoo-crm",
      testMatch: ["**/odoo-crm*"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        video: RECORD_VIDEO
          ? { mode: "on", size: { width: 1920, height: 1080 } }
          : { mode: "retain-on-failure", size: { width: 1920, height: 1080 } },
      },
    },
    {
      name: "odoo-crm-iphone",
      testMatch: ["**/odoo-crm*"],
      use: {
        ...devices["iPhone 14"],
        video: RECORD_VIDEO
          ? { mode: "on", size: { width: 390, height: 844 } }
          : { mode: "retain-on-failure", size: { width: 390, height: 844 } },
      },
    },
    {
      name: "odoo-crm-android",
      testMatch: ["**/odoo-crm*"],
      use: {
        ...devices["Pixel 7"],
        video: RECORD_VIDEO
          ? { mode: "on", size: { width: 412, height: 915 } }
          : { mode: "retain-on-failure", size: { width: 412, height: 915 } },
      },
    },
  ],

  webServer: [
    {
      command: `docker compose --profile dev up dev`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
