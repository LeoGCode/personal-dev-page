import { type Page, type APIRequestContext, expect } from "@playwright/test";

// ── Configuration ────────────────────────────────────────────────

const ODOO_PORT = process.env.ODOO_PORT || "8069";
export const ODOO_URL = process.env.ODOO_URL || `http://localhost:${ODOO_PORT}`;
const ODOO_USER = process.env.ODOO_USER || "admin";
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "admin";
const ODOO_DB = process.env.ODOO_DB || "nexora";

// Generous timeout for Odoo — its OWL UI can be slow on first load
const ODOO_TIMEOUT = 20_000;

// ── Health check ─────────────────────────────────────────────────

/**
 * Check whether the Odoo instance is reachable and has the database.
 * Use this in `test.skip()` to gracefully skip when Odoo isn't running.
 */
export async function isOdooAvailable(
  request: APIRequestContext,
): Promise<boolean> {
  try {
    const res = await request.get(`${ODOO_URL}/web/health`, {
      timeout: 5_000,
    });
    return res.ok();
  } catch {
    return false;
  }
}

// ── Authentication ───────────────────────────────────────────────

/**
 * Login to the Odoo web interface.
 * After login, waits for the main client action to be visible.
 */
export async function loginToOdoo(page: Page) {
  await page.goto(`${ODOO_URL}/web/login`, { waitUntil: "networkidle" });

  // Select the database if the selector is visible (multi-db mode)
  const dbSelect = page.locator('select[name="db"]');
  if (await dbSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await dbSelect.selectOption(ODOO_DB);
  }

  await page.locator('input[name="login"]').fill(ODOO_USER);
  await page.locator('input[name="password"]').fill(ODOO_PASSWORD);
  await page.locator('button[type="submit"]').click();

  // Wait for the web client to finish loading
  await page.waitForURL(/\/(odoo|web)/, { timeout: ODOO_TIMEOUT });

  // Wait for the main action manager or home menu to appear
  await page
    .locator(".o_home_menu, .o_action_manager, .o_main_navbar")
    .first()
    .waitFor({ state: "visible", timeout: ODOO_TIMEOUT });
}

// ── Navigation ───────────────────────────────────────────────────

/**
 * Navigate to the CRM pipeline (Kanban) view.
 */
export async function navigateToCRM(page: Page) {
  await page.goto(`${ODOO_URL}/odoo/crm`, { waitUntil: "domcontentloaded" });

  // Wait for either the Kanban or List view to render
  await page
    .locator(".o_kanban_view, .o_list_view, .o_action_manager")
    .first()
    .waitFor({ state: "visible", timeout: ODOO_TIMEOUT });
}

// ── Search ───────────────────────────────────────────────────────

/**
 * Search for a lead/opportunity in the current CRM view.
 * Types into the search bar and presses Enter.
 */
export async function searchLead(page: Page, query: string) {
  // Switch to list view — it reliably shows all records regardless of stage grouping
  const listViewBtn = page.locator(
    'button.o_switch_view.o_list, [data-tooltip="List"], .o_cp_switch_buttons button:nth-child(2)',
  );
  if (
    await listViewBtn
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false)
  ) {
    await listViewBtn.first().click();
    await page.waitForTimeout(1_500);
  }

  // Clear default filters (e.g. "My Pipeline") that hide unassigned leads
  const filterPills = page.locator(".o_searchview .o_facet_remove");
  const pillCount = await filterPills.count();
  for (let i = pillCount - 1; i >= 0; i--) {
    await filterPills.nth(i).click();
    await page.waitForTimeout(500);
  }

  // Click the search input area and type the query
  const searchInput = page.locator(".o_searchview_input");
  await searchInput.click();
  await searchInput.fill(query);
  await page.keyboard.press("Enter");

  // Wait for the view to reload with search results
  await page.waitForTimeout(2_000);
}

// ── Lead interaction ─────────────────────────────────────────────

/**
 * Open a lead by clicking it in the current view (Kanban card or List row).
 * Returns once the form view is loaded.
 */
export async function openLeadFromKanban(page: Page, leadName: string) {
  // Try both kanban cards and list view rows
  const record = page
    .locator(".o_kanban_record, .o_data_row")
    .filter({ hasText: leadName })
    .first();

  await expect(record).toBeVisible({ timeout: ODOO_TIMEOUT });
  await record.click();

  // Wait for the form view to load
  await page
    .locator(".o_form_view")
    .first()
    .waitFor({ state: "visible", timeout: ODOO_TIMEOUT });
}

/**
 * Verify that the currently-open lead has the expected field values.
 * Odoo renders fields as inputs/links/widgets, so we check input values
 * and attribute values rather than just text content.
 */
export async function verifyLeadDetails(
  page: Page,
  expected: {
    leadTitle?: string;
    contactName?: string;
    email?: string;
    tags?: string[];
  },
) {
  if (expected.leadTitle) {
    // The lead title is in the form header or breadcrumb
    await expect(page.locator(".o_form_view")).toContainText(
      expected.leadTitle,
      { timeout: 5_000 },
    );
  }

  if (expected.contactName) {
    // Contact name may be in an input, a span, or anywhere in the form
    const contactField = page.locator(
      '.o_field_widget[name="contact_name"] input',
    );
    if (
      await contactField
        .first()
        .isVisible({ timeout: 2_000 })
        .catch(() => false)
    ) {
      await expect(contactField.first()).toHaveValue(expected.contactName);
    } else {
      await expect(page.locator(".o_form_view")).toContainText(
        expected.contactName,
      );
    }
  }

  if (expected.email) {
    // Email may be in an input, a mailto link, or a span
    const emailInput = page.locator('.o_field_widget[name="email_from"] input');
    const emailLink = page.locator(
      '.o_field_widget[name="email_from"] a, .o_field_email a',
    );

    if (
      await emailInput
        .first()
        .isVisible({ timeout: 2_000 })
        .catch(() => false)
    ) {
      await expect(emailInput.first()).toHaveValue(expected.email);
    } else if (
      await emailLink
        .first()
        .isVisible({ timeout: 2_000 })
        .catch(() => false)
    ) {
      await expect(emailLink.first()).toContainText(expected.email);
    }
  }

  if (expected.tags) {
    for (const tag of expected.tags) {
      await expect(page.locator(".o_form_view")).toContainText(tag, {
        timeout: 3_000,
      });
    }
  }
}

// ── Chatter / Log notes ──────────────────────────────────────────

/**
 * Add a "Log note" in the chatter section of the current form view.
 */
export async function addLogNote(page: Page, text: string) {
  // Scroll down to make the chatter visible
  await page
    .locator(".o-mail-Chatter, .o_chatter")
    .first()
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Click "Log note" button/tab in the chatter
  const logNoteBtn = page
    .locator(
      'button:has-text("Log note"), .o-mail-Chatter-logNote, [name="log_note"]',
    )
    .first();
  await logNoteBtn.click();
  await page.waitForTimeout(1_000);

  // Odoo 18 uses a fake hidden textarea + a real visible one.
  // Target the visible, non-disabled composer input.
  const composer = page
    .locator(
      '.o-mail-Composer-input:not(.o-mail-Composer-fake):not([disabled]), .o-mail-Composer textarea:visible, .o-mail-Composer [contenteditable="true"]',
    )
    .first();

  // If the composer isn't visible yet, click "Log note" again to toggle it
  if (!(await composer.isVisible({ timeout: 3_000 }).catch(() => false))) {
    // Try clicking directly in the composer area to activate it
    const composerArea = page.locator(".o-mail-Composer").first();
    if (await composerArea.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await composerArea.click();
      await page.waitForTimeout(1_000);
    }
  }

  // Click on the composer input and type the note
  await composer.click();
  await page.waitForTimeout(500);
  await composer.fill(text);

  // Click the "Add" submit button
  const submitBtn = page
    .locator(
      '.o-mail-Composer button:has-text("Add"), .o-mail-Composer-send:visible',
    )
    .first();
  await submitBtn.click();

  // Wait for the note to appear in the chatter thread
  await expect(
    page
      .locator(".o-mail-Message-body, .o_mail_body")
      .filter({ hasText: text })
      .first(),
  ).toBeVisible({ timeout: 10_000 });
}

// ── Activities ───────────────────────────────────────────────────

/**
 * Schedule an activity on the currently-open record.
 */
export async function scheduleActivity(
  page: Page,
  opts: {
    type?: string; // e.g. "Call", "Meeting", "To-Do"
    summary: string;
    note?: string;
  },
) {
  // Click "Activities" or "Schedule activity" button
  const activityBtn = page
    .locator(
      'button:has-text("Activities"), button:has-text("Schedule activity"), .o_ChatterTopbar_activityBtn',
    )
    .first();
  await activityBtn.click();
  await page.waitForTimeout(1_000);

  // If there's an activity type selector, pick the type
  if (opts.type) {
    const typeSelect = page.locator(
      '.modal-content select[name="activity_type_id"], .o_field_widget[name="activity_type_id"] select',
    );
    if (await typeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await typeSelect.selectOption({ label: opts.type });
      await page.waitForTimeout(500);
    }
  }

  // Fill summary
  const summaryInput = page.locator(
    '.modal-content input[name="summary"], .o_field_widget[name="summary"] input',
  );
  if (await summaryInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await summaryInput.fill(opts.summary);
  }

  // Fill note if provided
  if (opts.note) {
    const noteInput = page.locator(
      '.modal-content textarea[name="note"], .modal-content .note-editable, .modal-content [contenteditable]',
    );
    if (await noteInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await noteInput.fill(opts.note);
    }
  }

  // Click "Schedule" button
  const scheduleBtn = page
    .locator('.modal-content button:has-text("Schedule")')
    .first();
  await scheduleBtn.click();
  await page.waitForTimeout(2_000);
}

// ── Pipeline stage management ────────────────────────────────────

/**
 * Move the currently-open lead to a different pipeline stage
 * by clicking the stage name in the status bar.
 */
export async function moveToStage(page: Page, stageName: string) {
  // The status bar shows stages as clickable buttons
  const stageBtn = page
    .locator(
      `.o_statusbar_status button:has-text("${stageName}"), .o_statusbar_status .o_arrow_button:has-text("${stageName}")`,
    )
    .first();

  if (await stageBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await stageBtn.click();
    await page.waitForTimeout(2_000);
    return;
  }

  // Fallback: try clicking a dropdown/select in the status bar
  const statusSelect = page.locator(
    ".o_statusbar_status select, .o_statusbar_status .dropdown-toggle",
  );
  if (await statusSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await statusSelect.click();
    await page
      .locator(`.dropdown-menu .dropdown-item:has-text("${stageName}")`)
      .click();
    await page.waitForTimeout(2_000);
  }
}

/**
 * Click the "Won" button to mark the opportunity as won.
 * In Odoo CRM, this is typically a dedicated button on the form.
 */
export async function markAsWon(page: Page) {
  const wonBtn = page
    .locator(
      'button:has-text("Won"), button:has-text("Mark Won"), .o_statusbar_status button.btn-success',
    )
    .first();

  await wonBtn.click();
  await page.waitForTimeout(2_000);

  // Handle the optional "Won reason" dialog that Odoo may show
  const dialog = page.locator(".modal-content");
  if (await dialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
    // Click "Mark as Won" or "Validate" in the dialog
    const confirmBtn = dialog
      .locator(
        'button:has-text("Mark as won"), button:has-text("Validate"), .btn-primary',
      )
      .first();
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2_000);
    }
  }
}

// ── JSON-RPC (direct API for verifications) ──────────────────────

/**
 * Search for a lead via Odoo JSON-RPC (API-level verification).
 * Useful for asserting data was saved correctly without relying on UI.
 */
export async function findLeadByApi(
  request: APIRequestContext,
  searchName: string,
): Promise<{
  id: number;
  name: string;
  contact_name: string;
  email_from: string;
  description: string;
  stage_id: [number, string];
} | null> {
  // Authenticate
  const authRes = await request.post(`${ODOO_URL}/jsonrpc`, {
    data: {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [ODOO_DB, ODOO_USER, ODOO_PASSWORD, {}],
      },
      id: 1,
    },
  });
  const authData = (await authRes.json()) as { result: number };
  const uid = authData.result;
  if (!uid) return null;

  // Search for the lead
  const searchRes = await request.post(`${ODOO_URL}/jsonrpc`, {
    data: {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          ODOO_DB,
          uid,
          ODOO_PASSWORD,
          "crm.lead",
          "search_read",
          [[["name", "ilike", searchName]]],
          {
            fields: [
              "id",
              "name",
              "contact_name",
              "email_from",
              "description",
              "stage_id",
            ],
            limit: 1,
          },
        ],
      },
      id: 2,
    },
  });

  const searchData = (await searchRes.json()) as {
    result: Array<{
      id: number;
      name: string;
      contact_name: string;
      email_from: string;
      description: string;
      stage_id: [number, string];
    }>;
  };

  return searchData.result?.[0] || null;
}

export { ODOO_URL as odooUrl, ODOO_DB as odooDb };
