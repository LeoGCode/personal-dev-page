import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────
// `after()` callbacks are collected so each test decides when the
// background work runs (it runs after the response in production).

const mocks = vi.hoisted(() => ({
  afterCallbacks: [] as Array<() => unknown>,
  send: vi.fn(),
  createCrmLead: vi.fn(),
  checkRateLimit: vi.fn(),
  captureException: vi.fn(),
  site: {
    NOTIFICATION_EMAIL: "leads@example.com",
    SITE_URL: "https://leogcode.dev",
  },
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (callback: () => unknown) => {
    mocks.afterCallbacks.push(callback);
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

vi.mock("@/lib/site", () => mocks.site);

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/odoo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/odoo")>()),
  createCrmLead: mocks.createCrmLead,
}));

vi.mock("@/lib/email", () => ({
  getEmailService: async () => ({ send: mocks.send }),
}));

vi.mock("@/lib/email/templates", () => ({
  renderNotificationEmail: async () => ({
    text: "notification",
    html: "<p>notification</p>",
  }),
  renderConfirmationEmail: async () => ({
    text: "confirmation",
    html: "<p>confirmation</p>",
  }),
}));

import { POST } from "@/app/api/collaborate/route";

// ── Helpers ──────────────────────────────────────────────────────

const validLead = {
  name: "Jane Doe",
  email: "jane@example.com",
  collaborationType: "consulting",
  description: "I would like help connecting my AI to my inbox.",
  locale: "en",
};

function postRequest(body: unknown = validLead) {
  return new Request("https://leogcode.dev/api/collaborate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://leogcode.dev",
      "x-real-ip": "203.0.113.7",
    },
    body: JSON.stringify(body),
  });
}

async function runAfterCallbacks() {
  for (const callback of mocks.afterCallbacks.splice(0)) {
    await callback();
  }
}

/** Recipients of every email sent so far, in order. */
function recipients() {
  return mocks.send.mock.calls.map(([params]) => params.to);
}

// ── Tests ────────────────────────────────────────────────────────

describe("POST /api/collaborate", () => {
  beforeEach(() => {
    mocks.afterCallbacks.length = 0;
    mocks.send.mockReset().mockResolvedValue({ id: "email-id" });
    mocks.createCrmLead.mockReset().mockResolvedValue(42);
    mocks.checkRateLimit.mockReset().mockResolvedValue(true);
    mocks.captureException.mockReset();
    mocks.site.NOTIFICATION_EMAIL = "leads@example.com";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns success only after the notification email was accepted", async () => {
    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    // The notification was sent before the response, not in the background.
    expect(recipients()).toEqual(["leads@example.com"]);
    expect(mocks.send.mock.calls[0][0].subject).toContain("Jane Doe");
  });

  it("sends the visitor confirmation and CRM lead in the background", async () => {
    await POST(postRequest());
    await runAfterCallbacks();

    expect(recipients()).toEqual(["leads@example.com", "jane@example.com"]);
    expect(mocks.createCrmLead).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "jane@example.com",
        tags: expect.arrayContaining(["type:consulting", "lang:en"]),
      }),
    );
  });

  it("returns 502 when the email provider rejects the notification", async () => {
    mocks.send.mockRejectedValueOnce(new Error("Resend API error"));

    const response = await POST(postRequest());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Lead could not be delivered",
    });
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { operation: "Notification email" },
      }),
    );
  });

  it("does not send the visitor a confirmation when the lead was not delivered", async () => {
    mocks.send.mockRejectedValueOnce(new Error("Resend API error"));

    await POST(postRequest());
    await runAfterCallbacks();

    expect(recipients()).toEqual(["leads@example.com"]);
    // CRM is still attempted as a second chance to capture the lead.
    expect(mocks.createCrmLead).toHaveBeenCalledTimes(1);
  });

  it("returns 502 without sending anything when NOTIFICATION_EMAIL is not set", async () => {
    mocks.site.NOTIFICATION_EMAIL = "";

    const response = await POST(postRequest());

    expect(response.status).toBe(502);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("NOTIFICATION_EMAIL"),
      }),
      expect.anything(),
    );
  });

  it("returns 502 when the email provider does not answer in time", async () => {
    vi.useFakeTimers();
    mocks.send.mockReturnValueOnce(new Promise(() => {}));

    const pending = POST(postRequest());
    await vi.advanceTimersByTimeAsync(10_000);
    const response = await pending;

    expect(response.status).toBe(502);
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("timed out"),
      }),
      expect.anything(),
    );
  });

  it("still returns success when the CRM sync fails", async () => {
    mocks.createCrmLead.mockRejectedValueOnce(new Error("Odoo down"));

    const response = await POST(postRequest());
    await runAfterCallbacks();

    expect(response.status).toBe(200);
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { operation: "CRM lead creation" } }),
    );
  });

  it("rejects invalid submissions without sending email", async () => {
    const response = await POST(postRequest({ ...validLead, email: "nope" }));

    expect(response.status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce(false);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await POST(postRequest());

    expect(response.status).toBe(429);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
