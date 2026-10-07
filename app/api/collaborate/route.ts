import { NextResponse, after } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  collaborateSchema,
  type CollaborateSubmission,
} from "@/lib/schemas/collaborate";
import { createCrmLead, buildCrmTags } from "@/lib/odoo";
import { checkRateLimit } from "@/lib/rate-limit";
import { getEmailService } from "@/lib/email";
import {
  renderConfirmationEmail,
  renderNotificationEmail,
} from "@/lib/email/templates";
import { NOTIFICATION_EMAIL, SITE_URL } from "@/lib/site";

/**
 * Build the set of allowed origins from SITE_URL.
 *
 * Accepts both the configured URL and its www / non-www counterpart so the
 * CORS check doesn't break when Cloudflare (or any other proxy) redirects
 * between the two variants.
 */
function getAllowedOrigins(siteUrl: string): Set<string> {
  const origins = new Set<string>();
  if (!siteUrl) return origins;

  origins.add(siteUrl);

  try {
    const parsed = new URL(siteUrl);
    if (parsed.hostname.startsWith("www.")) {
      parsed.hostname = parsed.hostname.slice(4);
    } else {
      parsed.hostname = `www.${parsed.hostname}`;
    }
    origins.add(parsed.origin);
  } catch {
    // invalid URL — stick with the raw value only
  }

  return origins;
}

const allowedOrigins = getAllowedOrigins(SITE_URL);

/**
 * Extract the client IP from reverse-proxy headers.
 *
 * Works on both self-hosted and Vercel deployments:
 *
 * • Self-hosted (Traefik/Nginx): the reverse proxy sets `x-real-ip` to the
 *   actual client IP and strips any client-provided value. Traefik does this
 *   by default. For Nginx, add: proxy_set_header X-Real-IP $remote_addr;
 *
 * • Vercel: sets both `x-real-ip` and `x-forwarded-for` from its edge
 *   network. Client-spoofed values are stripped automatically.
 *
 * Without a trusted proxy setting these headers, `x-forwarded-for` can be
 * spoofed and the rate limiter becomes ineffective.
 */
function getClientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** How long to wait for the email provider before reporting a failure. */
const NOTIFICATION_TIMEOUT_MS = 10_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Send the lead notification to NOTIFICATION_EMAIL and wait for the email
 * provider to accept it.
 *
 * Returns `false` (and reports to Sentry) when the lead could not be
 * delivered: NOTIFICATION_EMAIL unset, email service misconfigured, provider
 * error, or timeout. The caller must then tell the visitor it failed instead
 * of showing a success message for a lead nobody will see.
 */
async function deliverLeadNotification(
  data: CollaborateSubmission,
): Promise<boolean> {
  if (!NOTIFICATION_EMAIL) {
    const error = new Error(
      "NOTIFICATION_EMAIL is not configured — lead notification cannot be delivered",
    );
    Sentry.captureException(error, {
      tags: { operation: "Notification email" },
    });
    console.error(error.message);
    return false;
  }

  try {
    await withTimeout(
      (async () => {
        const emailService = await getEmailService();
        const notification = await renderNotificationEmail({
          name: data.name,
          email: data.email,
          collaborationType: data.collaborationType,
          description: data.description,
          budget: data.budget,
          timeline: data.timeline,
          referral: data.referral,
          locale: data.locale,
        });
        await emailService.send({
          to: NOTIFICATION_EMAIL,
          subject:
            data.locale === "es"
              ? `Nuevo lead: ${data.collaborationType} — ${data.name}`
              : `New lead: ${data.collaborationType} — ${data.name}`,
          text: notification.text,
          html: notification.html,
        });
      })(),
      NOTIFICATION_TIMEOUT_MS,
      "Notification email",
    );
    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "Notification email" },
    });
    console.error("Notification email failed:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // CORS validation
    const origin = request.headers.get("origin");
    if (allowedOrigins.size > 0 && origin && !allowedOrigins.has(origin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate
    const result = collaborateSchema.safeParse(body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: Object.keys(fieldErrors),
        },
        { status: 400 },
      );
    }

    const data = result.data;

    // Rate limiting
    const ip = getClientIp(request);
    const maxAttempts = Number(process.env.RATE_LIMIT_MAX) || 3;
    const allowed = await checkRateLimit(ip, maxAttempts);
    if (!allowed) {
      console.warn("[security] Rate limit exceeded", { ip });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // Build CRM tags and lead description synchronously (no I/O)
    const tags = buildCrmTags({
      collaborationType: data.collaborationType,
      budget: data.budget,
      referral: data.referral,
      locale: data.locale,
    });

    const leadDescription = [
      `Type: ${data.collaborationType}`,
      `Budget: ${data.budget || "Not specified"}`,
      `Timeline: ${data.timeline || "Not specified"}`,
      `Referral: ${data.referral || "Not specified"}`,
      `Language: ${data.locale}`,
      "",
      data.description,
    ].join("\n");

    // Lead notification is the delivery channel that must not fail
    // silently: await it, and only report success once the email provider
    // has accepted it. CRM sync and the visitor's confirmation email stay
    // best-effort and run after the response is sent.
    const delivered = await deliverLeadNotification(data);

    // CRM lead creation — best effort, also attempted when the notification
    // failed so the lead has a second chance to be captured.
    after(async () => {
      try {
        await createCrmLead({
          name: `${data.collaborationType}: ${data.name}`,
          contactName: data.name,
          email: data.email,
          description: leadDescription,
          tags,
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "CRM lead creation" },
        });
        console.error("CRM lead creation failed:", error);
      }
    });

    if (!delivered) {
      return NextResponse.json(
        { error: "Lead could not be delivered" },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ success: true });

    // Add CORS headers — mirror the validated origin so both www and
    // non-www variants receive the correct Access-Control-Allow-Origin.
    if (origin && allowedOrigins.has(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }

    // Confirmation email to the visitor — best effort, only once the lead
    // actually reached Leonel.
    after(async () => {
      try {
        const emailService = await getEmailService();
        const confirmation = await renderConfirmationEmail({
          name: data.name,
          collaborationType: data.collaborationType,
          budget: data.budget,
          timeline: data.timeline,
          locale: data.locale,
        });
        await emailService.send({
          to: data.email,
          subject:
            data.locale === "es"
              ? "¡Gracias por tu mensaje!"
              : "Thanks for reaching out!",
          text: confirmation.text,
          html: confirmation.html,
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "Confirmation email" },
        });
        console.error("Confirmation email failed:", error);
      }
    });

    return response;
  } catch (error) {
    Sentry.captureException(error);
    console.error("Collaborate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
