/**
 * Initialize Odoo for local development.
 *
 * Steps:
 *   1. Wait for Odoo to be reachable
 *   2. Create the database (with CRM module) if it doesn't exist
 *   3. Install extra modules (CRM, Contacts)
 *   4. Create a "Personal Site Leads" sales team
 *   5. Configure CRM pipeline stages
 *
 * Run:
 *   source scripts/ports.sh && node --experimental-strip-types scripts/odoo-init.ts
 *
 * Or via npm:
 *   npm run odoo:init
 */

const ODOO_URL = process.env.ODOO_URL || "http://localhost:8069";
const ODOO_DB = process.env.ODOO_DB || "nexora";
const ODOO_USER = process.env.ODOO_USER || "admin";
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "admin";
const MASTER_PASSWORD = process.env.ODOO_MASTER_PASSWORD || "admin";

// ── JSON-RPC helpers ─────────────────────────────────────────────

async function jsonRpc(
  url: string,
  method: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: Date.now() }),
  });
  const data = (await res.json()) as {
    result?: unknown;
    error?: { data?: { message?: string }; message?: string };
  };
  if (data.error) {
    const msg =
      data.error.data?.message || data.error.message || "Odoo RPC error";
    throw new Error(msg);
  }
  return data.result;
}

async function dbRpc(method: string, args: unknown[]): Promise<unknown> {
  return jsonRpc(`${ODOO_URL}/jsonrpc`, "call", {
    service: "db",
    method,
    args,
  });
}

let _uid: number | null = null;

async function authenticate(): Promise<number> {
  if (_uid) return _uid;
  const uid = (await jsonRpc(`${ODOO_URL}/jsonrpc`, "call", {
    service: "common",
    method: "authenticate",
    args: [ODOO_DB, ODOO_USER, ODOO_PASSWORD, {}],
  })) as number;
  if (!uid) throw new Error("Odoo authentication failed");
  _uid = uid;
  return uid;
}

async function execute(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<unknown> {
  const uid = await authenticate();
  return jsonRpc(`${ODOO_URL}/jsonrpc`, "call", {
    service: "object",
    method: "execute_kw",
    args: [ODOO_DB, uid, ODOO_PASSWORD, model, method, args, kwargs],
  });
}

// ── Utilities ────────────────────────────────────────────────────

function log(icon: string, msg: string) {
  console.log(`${icon}  ${msg}`);
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Step 1: Wait for Odoo ────────────────────────────────────────

async function waitForOdoo(timeoutMs = 120_000) {
  log("⏳", `Waiting for Odoo at ${ODOO_URL} ...`);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${ODOO_URL}/web/health`, {
        signal: AbortSignal.timeout(3_000),
      });
      if (res.ok) {
        log("✅", "Odoo is running");
        return;
      }
    } catch {
      // not ready yet
    }
    await sleep(2_000);
  }

  throw new Error(`Odoo not reachable at ${ODOO_URL} after ${timeoutMs}ms`);
}

// ── Step 2: Create database ──────────────────────────────────────

async function ensureDatabase() {
  log("🔍", `Checking if database '${ODOO_DB}' exists ...`);

  const databases = (await dbRpc("list", [])) as string[];

  if (databases.includes(ODOO_DB)) {
    log("ℹ️ ", `Database '${ODOO_DB}' already exists — skipping creation`);
    return false; // already existed
  }

  log("🔧", `Creating database '${ODOO_DB}' ...`);
  await dbRpc("create_database", [
    MASTER_PASSWORD,
    ODOO_DB,
    false, // demo data
    "en_US", // language
    ODOO_PASSWORD, // admin password
    ODOO_USER, // admin login
    "US", // country code
  ]);

  log("✅", `Database '${ODOO_DB}' created`);
  return true; // newly created
}

// ── Step 3: Install modules ──────────────────────────────────────

async function installModules(moduleNames: string[]) {
  log("📦", `Ensuring modules are installed: ${moduleNames.join(", ")}`);

  for (const name of moduleNames) {
    const ids = (await execute("ir.module.module", "search", [
      [
        ["name", "=", name],
        ["state", "!=", "installed"],
      ],
    ])) as number[];

    if (ids.length === 0) {
      log("ℹ️ ", `Module '${name}' is already installed`);
      continue;
    }

    log("📦", `Installing module '${name}' ...`);
    await execute("ir.module.module", "button_immediate_install", [ids]);
    log("✅", `Module '${name}' installed`);

    // Module installation can invalidate the session — re-auth
    _uid = null;
  }
}

// ── Step 4: Create sales team ────────────────────────────────────

async function ensureSalesTeam(): Promise<number> {
  const teamName = "Personal Site Leads";
  log("👥", `Ensuring sales team '${teamName}' ...`);

  const existing = (await execute(
    "crm.team",
    "search_read",
    [[["name", "=", teamName]]],
    { fields: ["id"], limit: 1 },
  )) as { id: number }[];

  if (existing.length > 0) {
    log("ℹ️ ", `Sales team already exists (id=${existing[0].id})`);
    return existing[0].id;
  }

  const teamId = (await execute("crm.team", "create", [
    {
      name: teamName,
      use_leads: true,
      use_opportunities: true,
    },
  ])) as number;

  log("✅", `Sales team created (id=${teamId})`);
  return teamId;
}

// ── Step 5: Configure pipeline stages ────────────────────────────

async function configurePipelineStages(teamId: number) {
  const desiredStages = [
    { name: "New", sequence: 1 },
    { name: "Qualified", sequence: 2 },
    { name: "Proposition", sequence: 3 },
    { name: "Negotiation", sequence: 4 },
    { name: "Won", sequence: 10, is_won: true },
  ];

  log("🔄", "Configuring pipeline stages ...");

  for (const stage of desiredStages) {
    const existing = (await execute(
      "crm.stage",
      "search_read",
      [[["name", "=", stage.name]]],
      { fields: ["id", "team_id"], limit: 1 },
    )) as { id: number; team_id: [number, string] | false }[];

    if (existing.length > 0) {
      // Make sure this stage is linked to our team
      await execute("crm.stage", "write", [
        [existing[0].id],
        {
          sequence: stage.sequence,
          team_id: teamId,
          ...(stage.is_won ? { is_won: true } : {}),
        },
      ]);
      log("ℹ️ ", `Stage '${stage.name}' updated (id=${existing[0].id})`);
    } else {
      const stageId = await execute("crm.stage", "create", [
        {
          name: stage.name,
          sequence: stage.sequence,
          team_id: teamId,
          ...(stage.is_won ? { is_won: true } : {}),
        },
      ]);
      log("✅", `Stage '${stage.name}' created (id=${stageId})`);
    }
  }
}

// ── Step 6: Create CRM tags ─────────────────────────────────────

async function ensureTags() {
  const tagNames = [
    "source:personal-site",
    "type:project",
    "type:consulting",
    "type:opensource",
    "type:speaking",
    "type:other",
  ];

  log("🏷️ ", "Ensuring CRM tags ...");

  for (const name of tagNames) {
    const existing = (await execute("crm.tag", "search", [
      [["name", "=", name]],
    ])) as number[];

    if (existing.length === 0) {
      await execute("crm.tag", "create", [{ name }]);
      log("  ✅", `Tag '${name}' created`);
    }
  }

  log("✅", "Tags ready");
}

// ── Step 7: Configure automated lead notification ────────────────

async function configureLeadNotification() {
  const actionName = "Personal Site — New Lead Notification";
  log("🔔", "Configuring automated lead notification ...");

  // Check if the automated action already exists
  const existing = (await execute("base.automation", "search", [
    [["name", "=", actionName]],
  ])) as number[];

  if (existing.length > 0) {
    log("ℹ️ ", "Automated notification already configured");
    return;
  }

  // Get the admin user ID for assignment
  const uid = await authenticate();

  // In Odoo 18, base.automation uses linked ir.actions.server records.
  // 1. Get the CRM lead model ID
  // 2. Create a server action with the Python code
  // 3. Create the automated action linking them together
  try {
    const modelIds = (await execute("ir.model", "search", [
      [["model", "=", "crm.lead"]],
    ])) as number[];
    const modelId = modelIds[0];

    // Create the server action
    const serverActionId = (await execute("ir.actions.server", "create", [
      {
        name: `${actionName} — Action`,
        model_id: modelId,
        state: "code",
        code: [
          `# Auto-generated by odoo-init`,
          `# Schedule a review activity for new personal-site leads`,
          `for lead in records:`,
          `    lead.activity_schedule(`,
          `        'mail.mail_activity_data_todo',`,
          `        summary='Review new lead: ' + (lead.contact_name or lead.name),`,
          `        note='A new collaboration request was submitted via the personal site. Review the details and follow up.',`,
          `        user_id=${uid},`,
          `    )`,
        ].join("\n"),
      },
    ])) as number;

    // Create the automated action
    await execute("base.automation", "create", [
      {
        name: actionName,
        model_id: modelId,
        trigger: "on_create",
        filter_domain: '[["name","ilike","[Personal Site]"]]',
        action_server_ids: [[4, serverActionId]],
        active: true,
      },
    ]);

    log(
      "✅",
      "Automated notification created — new leads will schedule a review activity",
    );
  } catch (err) {
    log("⚠️ ", `Could not create automated action: ${(err as Error).message}`);
    log(
      "ℹ️ ",
      "You can configure this manually in Odoo: Settings → Technical → Automated Actions",
    );
  }
}

// ── Step 8: Configure admin notification preferences ─────────────

async function configureAdminNotifications() {
  log("📬", "Configuring admin notification preferences ...");

  const uid = await authenticate();

  try {
    // Set the admin user to receive email notifications for assigned activities
    await execute("res.users", "write", [
      [uid],
      {
        notification_type: "email",
      },
    ]);
    log("✅", "Admin user set to receive email notifications");
  } catch (err) {
    log(
      "⚠️ ",
      `Could not update notification preferences: ${(err as Error).message}`,
    );
  }
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log("\n  ╭──────────────────────────────────╮");
  console.log("  │   Odoo CRM — Development Setup   │");
  console.log("  ╰──────────────────────────────────╯\n");

  await waitForOdoo();
  const isNew = await ensureDatabase();

  // After database creation, Odoo may need a moment to settle
  if (isNew) {
    log("⏳", "Waiting for database to be ready ...");
    await sleep(5_000);
  }

  await installModules(["crm", "contacts", "base_automation"]);
  const teamId = await ensureSalesTeam();
  await configurePipelineStages(teamId);
  await ensureTags();
  await configureLeadNotification();
  await configureAdminNotifications();

  console.log("\n  ╭──────────────────────────────────────────────────╮");
  console.log("  │   Odoo CRM ready!                                │");
  console.log(`  │   URL:      ${ODOO_URL.padEnd(36)}│`);
  console.log(`  │   Database: ${ODOO_DB.padEnd(36)}│`);
  console.log(`  │   Login:    ${ODOO_USER.padEnd(36)}│`);
  console.log(`  │   Team ID:  ${String(teamId).padEnd(36)}│`);
  console.log("  │                                                  │");
  console.log("  │   Set ODOO_PERSONAL_TEAM_ID in .env to:          │");
  console.log(`  │   ODOO_PERSONAL_TEAM_ID=${String(teamId).padEnd(24)}│`);
  console.log("  ╰──────────────────────────────────────────────────╯\n");
}

main().catch((err) => {
  console.error("\n❌ Odoo init failed:", err.message || err);
  process.exit(1);
});
