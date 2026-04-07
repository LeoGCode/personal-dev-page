import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

// ── i18n ─────────────────────────────────────────────────────────

const copy = {
  en: {
    preview: (name: string) =>
      `Hi ${name}, thanks for reaching out! I'll review your message shortly.`,
    greeting: (name: string) => `Hi ${name},`,
    body: "Thanks for reaching out. I've received your message and will review it carefully. You can expect a response within 48 hours.",
    details_heading: "What you submitted",
    type: "Type",
    budget: "Budget",
    timeline: "Timeline",
    sign_off: "Talk soon,",
    footer:
      "You received this email because you submitted a collaboration request on leoneldev.com.",
  },
  es: {
    preview: (name: string) =>
      `Hola ${name}, gracias por escribirme! Revisaré tu mensaje pronto.`,
    greeting: (name: string) => `Hola ${name},`,
    body: "Gracias por contactarme. Recibí tu mensaje y lo revisaré con atención. Podés esperar una respuesta dentro de las próximas 48 horas.",
    details_heading: "Lo que enviaste",
    type: "Tipo",
    budget: "Presupuesto",
    timeline: "Plazo",
    sign_off: "Hablamos pronto,",
    footer:
      "Recibiste este email porque enviaste una solicitud de colaboración en leoneldev.com.",
  },
} as const;

const typeLabels: Record<string, Record<string, string>> = {
  en: {
    project: "Project Collaboration",
    consulting: "Consulting",
    opensource: "Open Source",
    speaking: "Speaking",
    other: "Other",
  },
  es: {
    project: "Colaboración en Proyecto",
    consulting: "Consultoría",
    opensource: "Código Abierto",
    speaking: "Charlas",
    other: "Otro",
  },
};

const budgetLabels: Record<string, string> = {
  unsure: "—",
  under_1k: "< $1,000",
  "1k_5k": "$1,000 – $5,000",
  "5k_15k": "$5,000 – $15,000",
  over_15k: "> $15,000",
};

const timelineLabels: Record<string, Record<string, string>> = {
  en: {
    no_rush: "No rush",
    "1_3_months": "1–3 months",
    "3_6_months": "3–6 months",
    asap: "ASAP",
  },
  es: {
    no_rush: "Sin apuro",
    "1_3_months": "1–3 meses",
    "3_6_months": "3–6 meses",
    asap: "Lo antes posible",
  },
};

// ── Props ────────────────────────────────────────────────────────

export interface ConfirmationEmailProps {
  name: string;
  collaborationType: string;
  budget?: string;
  timeline?: string;
  locale?: "en" | "es";
}

// ── Template ─────────────────────────────────────────────────────

export default function ConfirmationEmail({
  name = "there",
  collaborationType = "project",
  budget,
  timeline,
  locale = "en",
}: ConfirmationEmailProps) {
  const t = copy[locale];
  const lang = locale;

  return (
    <Html lang={lang}>
      <Head />
      <Preview>{t.preview(name)}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>Leonel</Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Heading as="h1" style={heading}>
              {t.greeting(name)}
            </Heading>
            <Text style={paragraph}>{t.body}</Text>

            <Hr style={divider} />

            {/* Submission summary */}
            <Heading as="h2" style={subheading}>
              {t.details_heading}
            </Heading>
            <Section style={detailsBox}>
              <Text style={detailRow}>
                <strong>{t.type}:</strong>{" "}
                {typeLabels[lang]?.[collaborationType] || collaborationType}
              </Text>
              {budget && (
                <Text style={detailRow}>
                  <strong>{t.budget}:</strong>{" "}
                  {budgetLabels[budget] || budget}
                </Text>
              )}
              {timeline && (
                <Text style={detailRow}>
                  <strong>{t.timeline}:</strong>{" "}
                  {timelineLabels[lang]?.[timeline] || timeline}
                </Text>
              )}
            </Section>

            <Text style={paragraph}>
              {t.sign_off}
              <br />
              <strong>Leonel</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>{t.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ───────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "20px 0 48px",
};

const header: React.CSSProperties = {
  padding: "24px 32px",
};

const logoText: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  fontFamily: "'SF Mono', 'Fira Code', Menlo, Consolas, monospace",
  color: "#10b981",
  margin: 0,
};

const content: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "32px",
  border: "1px solid #e5e7eb",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 600,
  color: "#1f2937",
  margin: "0 0 16px",
};

const subheading: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#374151",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0 0 16px",
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const detailsBox: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
  padding: "16px 20px",
  marginBottom: "24px",
  borderLeft: "3px solid #10b981",
};

const detailRow: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#374151",
  margin: "0 0 4px",
};

const footer: React.CSSProperties = {
  padding: "24px 32px 0",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  lineHeight: "18px",
  margin: 0,
};
