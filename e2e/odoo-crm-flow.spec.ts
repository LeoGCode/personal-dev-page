import { test, expect } from "@playwright/test";
import { goTo } from "./fixtures/test-helpers";
import {
  isOdooAvailable,
  loginToOdoo,
  navigateToCRM,
  searchLead,
  openLeadFromKanban,
  verifyLeadDetails,
  addLogNote,
  scheduleActivity,
  moveToStage,
  markAsWon,
  findLeadByApi,
} from "./fixtures/odoo";
import {
  clearMailpit,
  waitForMailpitMessage,
  getMailpitMessageContent,
} from "./fixtures/mailpit";

/**
 * Odoo CRM E2E — Full Lead Lifecycle
 *
 * Simulates a visitor filling the collaborate form on the personal site,
 * then switches to the Odoo CRM dashboard to manage the resulting lead
 * through the full sales pipeline.
 *
 * Prerequisites:
 *   docker compose --profile odoo up -d          # start Odoo + DB
 *   pnpm run odoo:init                             # create database & configure CRM
 *   docker compose --profile dev up dev           # start the Next.js app
 *
 * Run:
 *   pnpm run e2e:odoo
 */

// Unique identifier so each test run creates a distinct lead
const RUN_ID = Date.now();
const LEAD_NAME = `E2E Tester ${RUN_ID}`;
const LEAD_EMAIL = `e2e-${RUN_ID}@test.example.com`;
const LEAD_DESCRIPTION =
  "I need help building a real-time analytics dashboard with Next.js and PostgreSQL. " +
  "The project involves streaming data from IoT sensors and displaying it on customizable widgets. " +
  "Looking for expertise in WebSockets, server components, and Drizzle ORM.";

test.describe("Odoo CRM — Lead Lifecycle", () => {
  test.beforeAll(async ({ request }) => {
    const available = await isOdooAvailable(request);
    test.skip(
      !available,
      "Odoo is not running — start it with: docker compose --profile odoo up -d && pnpm run odoo:init",
    );
  });

  test.setTimeout(120_000);

  test("submit collaborate form → lead appears in Odoo CRM → manage through pipeline", async ({
    page,
    request,
  }) => {
    // Odoo's admin UI is desktop-only — skip dashboard steps on mobile
    const viewport = page.viewportSize();
    const isMobile = (viewport?.width ?? 1920) < 768;

    // Clear Mailpit so we only see emails from this test run
    const sinceStart = Date.now();
    try {
      await clearMailpit(request);
    } catch {
      // Mailpit may not be running — email checks will be skipped
    }

    // ═══════════════════════════════════════════════════════════════
    // PART 1 — Submit the collaborate form on the personal site
    // ═══════════════════════════════════════════════════════════════

    await test.step("Navigate to the collaborate page", async () => {
      await goTo(page, "/collaborate");
      await expect(page.getByLabel(/your name/i)).toBeVisible();
    });

    await test.step("Fill in the collaboration form", async () => {
      // Name
      await page.getByLabel(/your name/i).fill(LEAD_NAME);

      // Email
      await page.getByLabel(/email/i).first().fill(LEAD_EMAIL);

      // Collaboration Type (Radix Select)
      await page.getByRole("combobox").first().click();
      await page
        .getByRole("option", { name: /project/i })
        .first()
        .click();

      // Description
      await page.getByLabel(/tell me about/i).fill(LEAD_DESCRIPTION);

      // Budget
      await page.getByRole("combobox").nth(1).click();
      await page
        .getByRole("option", { name: /5,000.*15,000/i })
        .first()
        .click();

      // Timeline
      await page.getByRole("combobox").nth(2).click();
      await page
        .getByRole("option", { name: /1.*3 months/i })
        .first()
        .click();

      // Referral
      await page.getByRole("combobox").nth(3).click();
      await page
        .getByRole("option", { name: /github/i })
        .first()
        .click();
    });

    await test.step("Submit the form and see success message", async () => {
      await page.getByRole("button", { name: /send message/i }).click();

      await expect(page.getByText(/message sent/i)).toBeVisible({
        timeout: 15_000,
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // PART 2 — Verify both emails were sent (confirmation + notification)
    // ═══════════════════════════════════════════════════════════════

    await test.step("Verify confirmation email was sent to the submitter", async () => {
      const confirmationMsg = await waitForMailpitMessage(request, {
        to: LEAD_EMAIL,
        subject: "Thanks",
        timeout: 15_000,
        since: sinceStart,
      });

      expect(confirmationMsg).toBeTruthy();
      expect(confirmationMsg.Subject).toContain("Thanks for reaching out");

      // Verify the HTML template was rendered (not plain text)
      const content = await getMailpitMessageContent(
        request,
        confirmationMsg.ID,
      );
      expect(content.html).toContain("<!DOCTYPE html");
      expect(content.html).toContain("Leonel");
      expect(content.html).toContain(LEAD_NAME);
      // Verify submission details are in the email
      expect(content.html).toContain("Project Collaboration");
    });

    await test.step("Verify notification email was sent to the site owner", async () => {
      const notificationMsg = await waitForMailpitMessage(request, {
        to: "hello@leogcode.dev",
        subject: "New lead",
        timeout: 15_000,
        since: sinceStart,
      });

      expect(notificationMsg).toBeTruthy();
      expect(notificationMsg.Subject).toContain(LEAD_NAME);

      // Verify the HTML template has the full lead details
      const content = await getMailpitMessageContent(
        request,
        notificationMsg.ID,
      );
      expect(content.html).toContain("<!DOCTYPE html");
      expect(content.html).toContain(LEAD_NAME);
      expect(content.html).toContain(LEAD_EMAIL);
      expect(content.html).toContain("Project Collaboration");
      // Verify the description is in the notification
      expect(content.text).toContain("analytics dashboard");
    });

    // ═══════════════════════════════════════════════════════════════
    // PART 3 — Verify the lead was created in Odoo via API
    // ═══════════════════════════════════════════════════════════════

    let leadData: Awaited<ReturnType<typeof findLeadByApi>>;

    await test.step("Verify lead exists in Odoo via JSON-RPC API", async () => {
      // The form sends: `${collaborationType}: ${name}` → "project: E2E Tester ..."
      // And the Odoo lib prepends "[Personal Site]" → "[Personal Site] project: E2E Tester ..."
      leadData = await findLeadByApi(request, LEAD_NAME);

      expect(leadData).not.toBeNull();
      expect(leadData!.email_from).toBe(LEAD_EMAIL);
      expect(leadData!.contact_name).toBe(LEAD_NAME);
      expect(leadData!.description).toContain("analytics dashboard");
    });

    // ═══════════════════════════════════════════════════════════════
    // PART 4–6 — Odoo dashboard interaction (desktop only)
    //
    // Odoo's admin UI is not responsive — the CRM pipeline, search
    // bar, and form views don't render properly on narrow viewports.
    // On mobile we still validate the full flow via API; we only skip
    // the browser-level Odoo UI interaction.
    // ═══════════════════════════════════════════════════════════════

    if (!isMobile) {
      await test.step("Login to Odoo web interface", async () => {
        await loginToOdoo(page);
      });

      await test.step("Navigate to CRM pipeline", async () => {
        await navigateToCRM(page);

        await expect(
          page.locator(".o_kanban_view, .o_list_view").first(),
        ).toBeVisible({ timeout: 15_000 });
      });

      await test.step("Search for the new lead", async () => {
        await searchLead(page, LEAD_NAME);

        await expect(
          page
            .locator(".o_kanban_record, .o_data_row")
            .filter({ hasText: LEAD_NAME })
            .first(),
        ).toBeVisible({ timeout: 10_000 });
      });

      await test.step("Open the lead details", async () => {
        await openLeadFromKanban(page, LEAD_NAME);
        await expect(page.locator(".o_form_view")).toBeVisible();
      });

      await test.step("Verify lead details in the form", async () => {
        await verifyLeadDetails(page, {
          leadTitle: LEAD_NAME,
          email: LEAD_EMAIL,
          tags: ["source:personal-site", "type:project"],
        });
      });

      await test.step("Add a log note about initial review", async () => {
        await addLogNote(
          page,
          "Reviewed the project requirements. Strong fit — Next.js + PostgreSQL is our core stack. IoT dashboard is an interesting challenge.",
        );
      });

      await test.step("Schedule a follow-up call activity", async () => {
        await scheduleActivity(page, {
          type: "Call",
          summary: `Follow-up call with ${LEAD_NAME}`,
          note: "Discuss project timeline, budget allocation, and technical requirements in detail.",
        });
      });

      await test.step("Move lead to Qualified stage", async () => {
        await moveToStage(page, "Qualified");
      });

      await test.step("Add qualification notes", async () => {
        await addLogNote(
          page,
          "Call completed. Client has clear requirements and realistic budget. Moving to proposal phase.",
        );
      });

      await test.step("Move lead to Proposition stage", async () => {
        await moveToStage(page, "Proposition");
      });

      await test.step("Add proposal note", async () => {
        await addLogNote(
          page,
          "Sent proposal for $12,000 — Phase 1: Data pipeline + basic dashboard (6 weeks). Phase 2: Real-time widgets + alerts (4 weeks).",
        );
      });

      await test.step("Mark the opportunity as Won", async () => {
        await markAsWon(page);
      });

      await test.step("Verify final lead state via API", async () => {
        const finalLead = await findLeadByApi(request, LEAD_NAME);
        expect(finalLead).not.toBeNull();

        if (finalLead!.stage_id) {
          const stageName = finalLead!.stage_id[1];
          expect(stageName).toBe("Won");
        }
      });
    }
  });

  test("lead created via form has correct tags in Odoo", async ({
    page,
    request,
  }) => {
    const tagTestId = Date.now();
    const tagTestName = `Tag Tester ${tagTestId}`;
    const tagTestEmail = `tags-${tagTestId}@test.example.com`;

    // Submit a form to create a lead with specific options
    await goTo(page, "/collaborate");

    await page.getByLabel(/your name/i).fill(tagTestName);
    await page.getByLabel(/email/i).first().fill(tagTestEmail);

    // Select "consulting" type
    await page.getByRole("combobox").first().click();
    await page
      .getByRole("option", { name: /consulting/i })
      .first()
      .click();

    await page
      .getByLabel(/tell me about/i)
      .fill(
        "We need consulting on migrating our legacy PHP application to a modern Next.js stack with proper CI/CD pipelines.",
      );

    // Select budget: Under $1,000
    await page.getByRole("combobox").nth(1).click();
    await page
      .getByRole("option", { name: /under.*1,000/i })
      .first()
      .click();

    // Referral: LinkedIn
    await page.getByRole("combobox").nth(3).click();
    await page
      .getByRole("option", { name: /linkedin/i })
      .first()
      .click();

    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/message sent/i)).toBeVisible({
      timeout: 15_000,
    });

    // Verify via API that the lead exists and has the correct description
    const lead = await findLeadByApi(request, tagTestName);
    expect(lead).not.toBeNull();
    expect(lead!.email_from).toBe(tagTestEmail);
    expect(lead!.contact_name).toBe(tagTestName);
    expect(lead!.description).toContain("Type: consulting");
    expect(lead!.description).toContain("Budget: under_1k");
    expect(lead!.description).toContain("Referral: linkedin");
  });

  test("emails are localized when form is submitted in Spanish", async ({
    page,
    request,
  }) => {
    const esTestId = Date.now();
    const esTestName = `Tester ES ${esTestId}`;
    const esTestEmail = `es-${esTestId}@test.example.com`;

    const sinceStart = Date.now();
    try {
      await clearMailpit(request);
    } catch {
      // Mailpit may not be running
    }

    // Navigate to the Spanish locale collaborate page
    await goTo(page, "/collaborate", "es");

    await page
      .getByLabel(/nombre/i)
      .first()
      .fill(esTestName);
    await page
      .getByLabel(/correo/i)
      .first()
      .fill(esTestEmail);

    // Select collaboration type
    await page.getByRole("combobox").first().click();
    await page
      .getByRole("option", { name: /proyecto/i })
      .first()
      .click();

    await page
      .getByLabel(/cuéntame|proyecto/i)
      .first()
      .fill(
        "Necesito ayuda para construir una plataforma de análisis de datos en tiempo real con Next.js y PostgreSQL.",
      );

    // Budget
    await page.getByRole("combobox").nth(1).click();
    await page
      .getByRole("option", { name: /1,000.*5,000/i })
      .first()
      .click();

    await page.getByRole("button", { name: /enviar/i }).click();
    await expect(page.getByText(/enviado/i)).toBeVisible({
      timeout: 15_000,
    });

    // Verify confirmation email is in Spanish
    await test.step("Confirmation email is in Spanish", async () => {
      const confirmMsg = await waitForMailpitMessage(request, {
        to: esTestEmail,
        subject: "Gracias",
        timeout: 15_000,
        since: sinceStart,
      });

      expect(confirmMsg).toBeTruthy();
      expect(confirmMsg.Subject).toContain("¡Gracias por tu mensaje!");

      const content = await getMailpitMessageContent(request, confirmMsg.ID);
      // Verify Spanish content in the HTML template
      expect(content.html).toContain("<!DOCTYPE html");
      expect(content.html).toContain('lang="es"');
      expect(content.html).toContain("Hola");
      expect(content.html).toContain("Colaboración en Proyecto");
      expect(content.html).toContain("Lo que enviaste");
      // Plain text fallback should also be in Spanish
      expect(content.text).toContain("Hablamos pronto");
    });

    // Verify notification email is also localized
    await test.step("Notification email is localized to Spanish", async () => {
      const notifyMsg = await waitForMailpitMessage(request, {
        to: "hello@leogcode.dev",
        subject: "Nuevo lead",
        timeout: 15_000,
        since: sinceStart,
      });

      expect(notifyMsg).toBeTruthy();
      expect(notifyMsg.Subject).toContain("Nuevo lead");

      const content = await getMailpitMessageContent(request, notifyMsg.ID);
      expect(content.html).toContain('lang="es"');
      expect(content.html).toContain("Nuevo Lead desde tu Sitio Personal");
      expect(content.html).toContain("Colaboración en Proyecto");
      expect(content.html).toContain("Presupuesto");
      expect(content.html).toContain("Mensaje");
    });
  });
});
