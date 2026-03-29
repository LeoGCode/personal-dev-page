import { NextResponse } from "next/server";
import { collaborateSchema } from "@/lib/schemas/collaborate";
import { createCrmLead, buildCrmTags } from "@/lib/odoo";
import { checkRateLimit } from "@/lib/redis";
import { resend, EMAIL_FROM } from "@/lib/resend";

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
        { status: 400 }
      );
    }

    const data = result.data;

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Create CRM lead in Odoo
    const tags = buildCrmTags({
      collaborationType: data.collaborationType,
      budget: data.budget,
      referral: data.referral,
      locale: data.locale,
    });

    try {
      await createCrmLead({
        name: `${data.collaborationType}: ${data.name}`,
        contactName: data.name,
        email: data.email,
        description: [
          `Type: ${data.collaborationType}`,
          `Budget: ${data.budget || "Not specified"}`,
          `Timeline: ${data.timeline || "Not specified"}`,
          `Referral: ${data.referral || "Not specified"}`,
          `Language: ${data.locale}`,
          "",
          data.description,
        ].join("\n"),
        tags,
      });
    } catch (odooError) {
      // Log but don't fail — the lead data is still in the request
      console.error("Odoo CRM sync failed:", odooError);
    }

    // Send confirmation email
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: data.email,
        subject: data.locale === "es" ? "¡Gracias por tu mensaje!" : "Thanks for reaching out!",
        text: data.locale === "es"
          ? `Hola ${data.name},\n\nGracias por contactarme. Revisaré tu mensaje y te responderé dentro de las próximas 48 horas.\n\n— Leonel`
          : `Hi ${data.name},\n\nThanks for reaching out. I'll review your message and get back to you within 48 hours.\n\n— Leonel`,
      });
    } catch (emailError) {
      console.error("Confirmation email failed:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collaborate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
