import { NextResponse } from "next/server";
import { collaborateSchema } from "@/lib/schemas/collaborate";
import { createCrmLead, buildCrmTags } from "@/lib/odoo";
import { checkRateLimit } from "@/lib/redis";
import { getEmailService } from "@/lib/email";
import {
  renderConfirmationEmail,
  renderNotificationEmail,
} from "@/lib/email/templates";

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Honeypot check
    if (body.honeypot) {
      return NextResponse.json({ success: true });
    }

    // Validate
    const result = collaborateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const data = result.data;

    // Rate limiting (RATE_LIMIT_MAX can be raised for E2E testing)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const maxAttempts = Number(process.env.RATE_LIMIT_MAX) || 3;
    const allowed = await checkRateLimit(ip, maxAttempts);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // Create CRM lead in Odoo
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

    try {
      await createCrmLead({
        name: `${data.collaborationType}: ${data.name}`,
        contactName: data.name,
        email: data.email,
        description: leadDescription,
        tags,
      });
    } catch (odooError) {
      // Log but don't fail — the lead data is still in the request
      console.error("Odoo CRM sync failed:", odooError);
    }

    // Send confirmation email to the person who submitted the form
    const emailService = await getEmailService();

    try {
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
    } catch (emailError) {
      console.error("Confirmation email failed:", emailError);
    }

    // Send notification email to the site owner
    if (NOTIFICATION_EMAIL) {
      try {
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
      } catch (notifyError) {
        console.error("Owner notification email failed:", notifyError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collaborate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
