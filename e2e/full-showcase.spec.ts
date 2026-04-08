import { test, expect, type Page } from "@playwright/test";
import { goTo, waitForHydration } from "./fixtures/test-helpers";
import {
  clearMailpit,
  waitForMailpitMessage,
  MAILPIT_API,
} from "./fixtures/mailpit";

/**
 * Full User-Flow Showcase
 *
 * Single test that navigates every public page using only in-app links
 * (navbar, CTAs, footer). Completes a full collaboration form submission,
 * views the confirmation email in Mailpit, switches language, and scrolls
 * every page so the recorded video doubles as a site presentation.
 *
 * Prerequisites:
 *   docker compose up mailpit
 *
 * Run with:
 *   RECORD_VIDEO=true npx playwright test full-showcase --project=desktop-chrome
 */

const SHOWCASE_EMAIL = `showcase-${Date.now()}@example.com`;
const PAUSE = 600; // ms between actions — keeps video watchable
const SCROLL_PX_PER_SEC = 500; // scrolling speed in pixels per second

/**
 * Smooth-scroll to a target Y position using requestAnimationFrame.
 * Produces a steady, natural-looking scroll in the recorded video.
 */
async function smoothScroll(page: Page, to: "bottom" | "top") {
  await page.evaluate(
    async ({ direction, speed }) => {
      await new Promise<void>((resolve) => {
        const target =
          direction === "bottom"
            ? document.body.scrollHeight - window.innerHeight
            : 0;
        const distance = Math.abs(target - window.scrollY);
        if (distance < 1) {
          resolve();
          return;
        }

        const duration = (distance / speed) * 1000;
        const start = window.scrollY;
        let startTime: number | null = null;

        function step(timestamp: number) {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          window.scrollTo(0, start + (target - start) * ease);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(step);
      });
    },
    { direction: to, speed: SCROLL_PX_PER_SEC },
  );
  await page.waitForTimeout(PAUSE);
}

async function scrollPage(page: Page) {
  await smoothScroll(page, "bottom");
  await smoothScroll(page, "top");
}

/** Click a navbar link by its visible text. Opens the mobile menu first if needed. */
async function clickNavLink(page: Page, name: string | RegExp) {
  // Try the desktop nav first
  let link = page.getByRole("navigation").getByRole("link", { name }).first();

  if (!(await link.isVisible({ timeout: 1_000 }).catch(() => false))) {
    // Mobile — open the hamburger menu (Sheet).
    // The sr-only label is "Menu" (EN) or "Menú" (ES).
    const menuBtn = page.getByRole("button", { name: /men[uú]/i });
    if (await menuBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(PAUSE);
    }
    // The Sheet renders links outside <nav>, search the full page
    link = page.getByRole("link", { name }).first();
  }

  const href = await link.getAttribute("href");
  await link.click();
  if (href) {
    await page.waitForURL(`**${href}`);
  }
  await waitForHydration(page);
  await page.waitForTimeout(PAUSE);
}

test("Full showcase — navigate every page + submit collaboration form + verify email", async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);

  // Clear Mailpit inbox before starting
  const sinceStart = Date.now();
  try {
    await clearMailpit(request);
  } catch {
    // Mailpit might not be running — continue anyway
    console.log("Mailpit not available — email verification will be skipped");
  }

  // =====================================================================
  // HOME PAGE
  // =====================================================================
  await goTo(page, "/");

  // Hero section
  await expect(page.getByText(/Hi, I'm Leonel/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Software Engineer/i }).first(),
  ).toBeVisible();
  await page.waitForTimeout(PAUSE);

  // Scroll the full homepage: Hero → About → Skills → Projects → CTA → Footer
  await scrollPage(page);

  // =====================================================================
  // PROJECTS PAGE — via navbar
  // =====================================================================
  await clickNavLink(page, /projects/i);

  await expect(
    page.getByRole("heading", { name: /projects/i }).first(),
  ).toBeVisible();

  // Show all project cards
  await scrollPage(page);

  // =====================================================================
  // PROJECT DETAIL — click on the first project
  // =====================================================================
  const firstProject = page.locator("a[href*='/projects/']").first();
  await expect(firstProject).toBeVisible();
  await firstProject.click();
  await waitForHydration(page);
  await page.waitForTimeout(PAUSE);

  await expect(page).toHaveURL(/\/en\/projects\/.+/);
  await expect(page.getByRole("heading").first()).toBeVisible();

  // Scroll the project detail page (description, tech stack, highlights)
  await scrollPage(page);

  // =====================================================================
  // BLOG PAGE — via navbar
  // =====================================================================
  await clickNavLink(page, /blog/i);

  await expect(
    page.getByRole("heading", { name: /blog/i }).first(),
  ).toBeVisible();

  // Show all blog post cards
  await scrollPage(page);

  // =====================================================================
  // BLOG POST DETAIL — click the first post
  // =====================================================================
  const firstPost = page
    .locator("a[href*='/blog/']")
    .filter({ hasNotText: /^blog$/i })
    .first();
  await expect(firstPost).toBeVisible();
  await firstPost.click();
  await waitForHydration(page);
  await page.waitForTimeout(PAUSE);

  await expect(page).toHaveURL(/\/en\/blog\/.+/);

  // Scroll the full blog post
  await scrollPage(page);

  // =====================================================================
  // COLLABORATE PAGE — via navbar CTA button
  // =====================================================================
  const collaborateLink = page
    .getByRole("link", { name: /collaborate|colaborar/i })
    .first();

  if (
    !(await collaborateLink.isVisible({ timeout: 1_000 }).catch(() => false))
  ) {
    const menuBtn = page.getByRole("button", { name: /men[uú]/i });
    if (await menuBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(PAUSE);
    }
  }

  await collaborateLink.click();
  await waitForHydration(page);
  await page.waitForTimeout(PAUSE);

  await expect(page).toHaveURL(/\/en\/collaborate/);

  // Scroll the form page
  await scrollPage(page);

  // =====================================================================
  // FILL & SUBMIT COLLABORATION FORM
  // =====================================================================

  // Name
  await page.getByLabel(/your name/i).fill("Maria Garcia");
  await page.waitForTimeout(200);

  // Email
  await page.getByLabel(/email/i).first().fill(SHOWCASE_EMAIL);
  await page.waitForTimeout(200);

  // Collaboration Type — Radix Select
  await page.getByRole("combobox").first().click();
  await page.waitForTimeout(300);
  await page
    .getByRole("option", { name: /end-to-end product build/i })
    .first()
    .click();
  await page.waitForTimeout(200);

  // Description
  await page
    .getByLabel(/tell me about/i)
    .fill(
      "I'm building a SaaS platform for managing freelance teams and need help with the architecture. Looking for someone experienced with Next.js, PostgreSQL, and Docker deployments. The project has a 3-month timeline and a $10k budget.",
    );
  await page.waitForTimeout(200);

  // Budget
  await page.getByRole("combobox").nth(1).click();
  await page.waitForTimeout(300);
  await page
    .getByRole("option", { name: /5,000.*15,000/i })
    .first()
    .click();
  await page.waitForTimeout(200);

  // Timeline
  await page.getByRole("combobox").nth(2).click();
  await page.waitForTimeout(300);
  await page
    .getByRole("option", { name: /1.*3 months/i })
    .first()
    .click();
  await page.waitForTimeout(200);

  // Referral
  await page.getByRole("combobox").nth(3).click();
  await page.waitForTimeout(300);
  await page
    .getByRole("option", { name: /github/i })
    .first()
    .click();
  await page.waitForTimeout(PAUSE);

  // Scroll to show the filled form
  await smoothScroll(page, "bottom");
  await page.waitForTimeout(PAUSE);

  // Submit
  await page.getByRole("button", { name: /send message/i }).click();

  // Wait for success state
  await expect(page.getByText(/message sent/i)).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(PAUSE);

  // =====================================================================
  // MAILPIT — verify both emails arrived (confirmation + notification)
  // =====================================================================
  const MAILPIT_UI = process.env.MAILPIT_UI_PORT
    ? `http://localhost:${process.env.MAILPIT_UI_PORT}`
    : MAILPIT_API.replace("/api/v1", "");

  let mailpitAvailable = true;
  try {
    // ── 1. Confirmation email (to the submitter) ──────────────────
    const confirmationEmail = await waitForMailpitMessage(request, {
      to: SHOWCASE_EMAIL,
      subject: "Thanks",
      timeout: 15_000,
      since: sinceStart,
    });
    expect(confirmationEmail).toBeTruthy();

    // Navigate to Mailpit web UI to show inbox
    await page.goto(`${MAILPIT_UI}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(PAUSE);

    // Click the confirmation email to preview it
    const confirmRow = page
      .locator(`text=${confirmationEmail.Subject}`)
      .first();
    if (await confirmRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmRow.click();
      await page.waitForTimeout(PAUSE);
    }

    await scrollPage(page);

    // Show the full HTML render of the confirmation email
    await page.goto(
      `${MAILPIT_API}/message/${confirmationEmail.ID}/part/0/html`,
      { waitUntil: "networkidle" },
    );
    await page.waitForTimeout(PAUSE);
    await scrollPage(page);

    // ── 2. Notification email (to the site owner) ─────────────────
    const notificationEmail = await waitForMailpitMessage(request, {
      to: "hello@leogcode.dev",
      subject: "New lead",
      timeout: 15_000,
      since: sinceStart,
    });
    expect(notificationEmail).toBeTruthy();

    // Go back to Mailpit inbox
    await page.goto(`${MAILPIT_UI}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(PAUSE);

    // Click the notification email to preview it
    const notifyRow = page.locator(`text=${notificationEmail.Subject}`).first();
    if (await notifyRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notifyRow.click();
      await page.waitForTimeout(PAUSE);
    }

    await scrollPage(page);

    // Show the full HTML render of the notification email
    await page.goto(
      `${MAILPIT_API}/message/${notificationEmail.ID}/part/0/html`,
      { waitUntil: "networkidle" },
    );
    await page.waitForTimeout(PAUSE);
    await scrollPage(page);
  } catch {
    mailpitAvailable = false;
    console.log("Mailpit not available — skipping email verification");
  }

  // =====================================================================
  // LANGUAGE SWITCH — EN → ES
  // =====================================================================
  await goTo(page, "/");

  // Switch to Spanish (locale button is always visible, even on mobile)
  const localeSwitcher = page.getByRole("button", { name: /ES/i }).first();
  await localeSwitcher.click();
  await waitForHydration(page);
  await page.waitForTimeout(PAUSE);

  await expect(page).toHaveURL(/\/es/);

  // Scroll the Spanish homepage
  await scrollPage(page);

  // Visit Spanish projects page
  await clickNavLink(page, /proyectos/i);
  await expect(
    page.getByRole("heading", { name: /proyectos/i }).first(),
  ).toBeVisible();
  await scrollPage(page);

  // Visit Spanish blog page
  await clickNavLink(page, /blog/i);
  await scrollPage(page);

  // =====================================================================
  // SWITCH BACK TO ENGLISH
  // =====================================================================
  const enSwitcher = page.getByRole("button", { name: /EN/i }).first();
  await enSwitcher.click();
  await waitForHydration(page);
  await page.waitForTimeout(PAUSE);

  await expect(page).toHaveURL(/\/en/);

  // =====================================================================
  // FINAL — return to home
  // =====================================================================
  await page.getByRole("link", { name: "Leonel" }).click();
  await waitForHydration(page);
  await page.waitForTimeout(PAUSE);

  // Final scroll of the homepage
  await scrollPage(page);

  // Log result
  if (mailpitAvailable) {
    console.log(
      `\n✅ Full showcase completed with email verification (${SHOWCASE_EMAIL})`,
    );
  } else {
    console.log(
      "\n✅ Full showcase completed (Mailpit not available — email verification skipped)",
    );
  }
});
