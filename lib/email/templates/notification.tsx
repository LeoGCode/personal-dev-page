import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

// ── i18n ─────────────────────────────────────────────────────────

const copy = {
  en: {
    preview: (name: string, type: string) =>
      `New ${type} lead from ${name} via your personal site`,
    title: "New Lead from Personal Site",
    message_heading: "Message",
    reply_hint: (email: string) => `Reply directly to ${email} to respond.`,
    footer: "Sent automatically by your personal site lead pipeline.",
    labels: {
      name: "Name",
      email: "Email",
      type: "Type",
      budget: "Budget",
      timeline: "Timeline",
      referral: "Found via",
      language: "Language",
    },
  },
  es: {
    preview: (name: string, type: string) =>
      `Nuevo lead de ${type} de ${name} desde tu sitio personal`,
    title: "Nuevo Lead desde tu Sitio Personal",
    message_heading: "Mensaje",
    reply_hint: (email: string) =>
      `Respondé directamente a ${email} para contactarlo.`,
    footer:
      "Enviado automáticamente por el pipeline de leads de tu sitio personal.",
    labels: {
      name: "Nombre",
      email: "Email",
      type: "Tipo",
      budget: "Presupuesto",
      timeline: "Plazo",
      referral: "Encontró via",
      language: "Idioma",
    },
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
  unsure: "Not sure yet",
  under_1k: "Under $1,000",
  "1k_5k": "$1,000 – $5,000",
  "5k_15k": "$5,000 – $15,000",
  over_15k: "Over $15,000",
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

const referralLabels: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  linkedin: "LinkedIn",
  referral: "Referral",
  other: "Other",
};

// ── Props ────────────────────────────────────────────────────────

export interface NotificationEmailProps {
  name: string;
  email: string;
  collaborationType: string;
  description: string;
  budget?: string;
  timeline?: string;
  referral?: string;
  locale?: "en" | "es";
}

// ── Template ─────────────────────────────────────────────────────

export default function NotificationEmail({
  name = "Someone",
  email = "unknown@example.com",
  collaborationType = "project",
  description = "",
  budget,
  timeline,
  referral,
  locale = "en",
}: NotificationEmailProps) {
  const t = copy[locale];
  const lang = locale;

  const details: { label: string; value: string }[] = [
    { label: t.labels.name, value: name },
    { label: t.labels.email, value: email },
    {
      label: t.labels.type,
      value: typeLabels[lang]?.[collaborationType] || collaborationType,
    },
    {
      label: t.labels.budget,
      value: budget ? budgetLabels[budget] || budget : "—",
    },
    {
      label: t.labels.timeline,
      value: timeline
        ? timelineLabels[lang]?.[timeline] || timeline
        : "—",
    },
    {
      label: t.labels.referral,
      value: referral ? referralLabels[referral] || referral : "—",
    },
    { label: t.labels.language, value: lang.toUpperCase() },
  ];

  return (
    <Html lang={lang}>
      <Head />
      <Preview>{t.preview(name, typeLabels[lang]?.[collaborationType] || collaborationType)}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Green header bar */}
          <Section style={headerBar}>
            <Heading as="h1" style={headerTitle}>
              {t.title}
            </Heading>
          </Section>

          {/* Details table */}
          <Section style={content}>
            {details.map((d) => (
              <Row key={d.label} style={tableRow}>
                <Column style={labelCol}>{d.label}</Column>
                <Column style={valueCol}>
                  {d.label === t.labels.email ? (
                    <Link href={`mailto:${d.value}`} style={emailLink}>
                      {d.value}
                    </Link>
                  ) : (
                    d.value
                  )}
                </Column>
              </Row>
            ))}

            <Hr style={divider} />

            {/* Message */}
            <Heading as="h2" style={subheading}>
              {t.message_heading}
            </Heading>
            <Section style={messageBox}>
              <Text style={messageText}>{description}</Text>
            </Section>

            <Text style={hintText}>
              {t.reply_hint(email)}
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
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px 0 48px",
};

const headerBar: React.CSSProperties = {
  backgroundColor: "#10b981",
  borderRadius: "8px 8px 0 0",
  padding: "20px 32px",
};

const headerTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 600,
  margin: 0,
};

const content: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "0 0 8px 8px",
  padding: "28px 32px",
  border: "1px solid #e5e7eb",
  borderTop: "none",
};

const tableRow: React.CSSProperties = {
  marginBottom: "2px",
};

const labelCol: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#6b7280",
  padding: "6px 12px 6px 0",
  whiteSpace: "nowrap" as const,
  verticalAlign: "top",
  width: "100px",
};

const valueCol: React.CSSProperties = {
  fontSize: "14px",
  color: "#1f2937",
  padding: "6px 0",
};

const emailLink: React.CSSProperties = {
  color: "#10b981",
  textDecoration: "none",
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const subheading: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
  margin: "0 0 10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const messageBox: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
  padding: "16px 20px",
  borderLeft: "3px solid #10b981",
  marginBottom: "20px",
};

const messageText: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#4b5563",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

const hintText: React.CSSProperties = {
  fontSize: "13px",
  color: "#9ca3af",
  margin: 0,
};

const footer: React.CSSProperties = {
  padding: "20px 32px 0",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  lineHeight: "18px",
  margin: 0,
};
