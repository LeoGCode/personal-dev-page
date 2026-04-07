const ODOO_URL = process.env.ODOO_URL || "http://localhost:8069";
const ODOO_DB = process.env.ODOO_DB || "nexora";
const ODOO_USER = process.env.ODOO_USER || "admin";
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "admin";

let cachedUid: number | null = null;

async function jsonRpc(
  url: string,
  method: string,
  params: Record<string, unknown>,
) {
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
  if (cachedUid) return cachedUid;

  const uid = await jsonRpc(`${ODOO_URL}/jsonrpc`, "call", {
    service: "common",
    method: "authenticate",
    args: [ODOO_DB, ODOO_USER, ODOO_PASSWORD, {}],
  });

  if (!uid) throw new Error("Odoo authentication failed");
  cachedUid = uid;
  return uid;
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
  const tagIds = await ensureTags(data.tags);
  const uid = await authenticate();

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
  const ids: number[] = [];
  for (const name of tagNames) {
    const existing = await odooRpc("crm.tag", "search", [
      [["name", "=", name]],
    ]);
    if (existing.length > 0) {
      ids.push(existing[0]);
    } else {
      try {
        const newId = await odooRpc("crm.tag", "create", [{ name }]);
        ids.push(newId);
      } catch {
        // Handle race condition: tag was created between our search and create
        const retry = await odooRpc("crm.tag", "search", [
          [["name", "=", name]],
        ]);
        if (retry.length > 0) {
          ids.push(retry[0]);
        }
      }
    }
  }
  return ids;
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
