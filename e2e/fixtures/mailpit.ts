import { type APIRequestContext } from "@playwright/test";

const MAILPIT_API = process.env.MAILPIT_API ?? "http://localhost:8025/api/v1";

interface MailpitMessage {
  ID: string;
  Subject: string;
  From: { Address: string };
  To: { Address: string }[];
  Created: string;
}

interface MailpitSearchResult {
  messages: MailpitMessage[];
  total: number;
}

/**
 * Clear all emails in Mailpit inbox.
 */
export async function clearMailpit(request: APIRequestContext) {
  await request.delete(`${MAILPIT_API}/messages`);
}

/**
 * Wait for an email matching criteria to arrive in Mailpit.
 * Polls every 500ms until found or timeout.
 */
export async function waitForMailpitMessage(
  request: APIRequestContext,
  opts: {
    to: string;
    subject?: string;
    timeout?: number;
    since?: number;
  },
): Promise<MailpitMessage> {
  const { to, subject, timeout = 15_000 } = opts;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const query = subject ? `to:${to} subject:"${subject}"` : `to:${to}`;
    const resp = await request.get(
      `${MAILPIT_API}/search?query=${encodeURIComponent(query)}`,
    );

    if (resp.ok()) {
      const data: MailpitSearchResult = await resp.json();
      if (data.messages?.length > 0) {
        // If `since` is provided, filter out older messages
        if (opts.since) {
          const sinceDate = new Date(opts.since);
          const fresh = data.messages.find(
            (m) => new Date(m.Created) >= sinceDate,
          );
          if (fresh) return fresh;
        } else {
          return data.messages[0];
        }
      }
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(
    `Mailpit: no email found for to=${to} subject=${subject} within ${timeout}ms`,
  );
}

/**
 * Get the full message content (text/HTML) by ID.
 */
export async function getMailpitMessageContent(
  request: APIRequestContext,
  messageId: string,
): Promise<{ text: string; html: string }> {
  const resp = await request.get(`${MAILPIT_API}/message/${messageId}`);
  const data = await resp.json();
  return { text: data.Text || "", html: data.HTML || "" };
}

export { MAILPIT_API };
