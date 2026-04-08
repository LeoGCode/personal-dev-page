const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USER = process.env.ODOO_USER;
const ODOO_PASSWORD = process.env.ODOO_PASSWORD;

/**
 * Returns true when all four Odoo env vars are set.
 *
 * On Vercel (or any deployment without a reachable Odoo instance),
 * simply leave these vars unset — CRM integration will be skipped
 * gracefully and the form still works (emails are the primary channel).
 */
function isOdooConfigured(): boolean {
  return !!(ODOO_URL && ODOO_DB && ODOO_USER && ODOO_PASSWORD);
}

function assertOdooConfig() {
  if (!isOdooConfigured()) {
    throw new Error(
      "Missing Odoo configuration. Set ODOO_URL, ODOO_DB, ODOO_USER, and ODOO_PASSWORD environment variables.",
    );
  }
}

let cachedUid: number | null = null;
let cachedUidExpiresAt = 0;
const UID_TTL_MS = 3_600_000; // 1 hour

async function jsonRpc(
  url: string,
  method: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: Date.now(),
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(
      data.error.data?.message || data.error.message || "Odoo RPC error",
    );
  }
  return data.result;
}

async function authenticate(): Promise<number> {
  assertOdooConfig();

  if (cachedUid && Date.now() < cachedUidExpiresAt) return cachedUid;

  const uid = await jsonRpc(`${ODOO_URL}/jsonrpc`, "call", {
    service: "common",
    method: "authenticate",
    args: [ODOO_DB, ODOO_USER, ODOO_PASSWORD, {}],
  });

  if (!uid) throw new Error("Odoo authentication failed");
  cachedUid = uid as number;
  cachedUidExpiresAt = Date.now() + UID_TTL_MS;
  return cachedUid;
}

export async function odooRpc(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
) {
  const uid = await authenticate();

  return jsonRpc(`${ODOO_URL}/jsonrpc`, "call", {
    service: "object",
    method: "execute_kw",
    args: [ODOO_DB, uid, ODOO_PASSWORD, model, method, args, kwargs],
  });
}

export async function createCrmLead(data: {
  name: string;
  contactName: string;
  email: string;
  description: string;
  tags: string[];
  teamId?: number;
}) {
  if (!isOdooConfigured()) {
    console.info("[CRM] Odoo not configured — skipping lead creation");
    return null;
  }

  const [tagIds, uid] = await Promise.all([
    ensureTags(data.tags),
    authenticate(),
  ]);

  return odooRpc("crm.lead", "create", [
    {
      name: `[Personal Site] ${data.name}`,
      contact_name: data.contactName,
      email_from: data.email,
      description: data.description,
      team_id:
        data.teamId || Number(process.env.ODOO_PERSONAL_TEAM_ID) || false,
      tag_ids: tagIds.map((id: number) => [4, id]),
      // Assign to the authenticated Odoo user so they receive
      // internal notifications and the lead appears in "My Pipeline"
      user_id: uid,
    },
  ]);
}

async function ensureTags(tagNames: string[]): Promise<number[]> {
  const results = await Promise.all(
    tagNames.map(async (name) => {
      const existing = (await odooRpc("crm.tag", "search", [
        [["name", "=", name]],
      ])) as number[];
      if (existing.length > 0) {
        return existing[0];
      }
      try {
        return (await odooRpc("crm.tag", "create", [{ name }])) as number;
      } catch {
        // Handle race condition: tag was created between our search and create
        const retry = (await odooRpc("crm.tag", "search", [
          [["name", "=", name]],
        ])) as number[];
        if (retry.length > 0) {
          return retry[0];
        }
        throw new Error(`Failed to create or find tag: ${name}`);
      }
    }),
  );
  return results;
}

export function buildCrmTags(data: {
  collaborationType: string;
  budget?: string;
  referral?: string;
  locale: string;
}) {
  const tags = ["source:personal-site"];
  tags.push(`type:${data.collaborationType}`);
  if (data.budget) tags.push(`budget:${data.budget}`);
  if (data.referral) tags.push(`channel:${data.referral}`);
  tags.push(`lang:${data.locale}`);
  return tags;
}
