import { ImageResponse } from "next/og";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { SITE_DOMAIN } from "@/lib/site";

export const alt = "Leonel — AI setup";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
 * Share image for /[locale]/ai — what WhatsApp, LinkedIn and iMessage show
 * when the page link is sent. Same palette as the site-wide image
 * (app/opengraph-image.tsx), copy taken from the page's dictionary.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = (locale === "es" ? es : en).ai_setup;

  const chips = [copy.chips.any_ai, copy.chips.not_course, copy.hero.cta];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 85% 20%, rgba(74, 222, 128, 0.16), transparent 45%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#4ade80",
          }}
        />
        <span style={{ fontSize: 22, color: "#71717a" }}>
          {`${SITE_DOMAIN}/ai`}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 26, fontWeight: 600, color: "#4ade80" }}>
          {copy.hero.eyebrow}
        </span>
        <span
          style={{
            marginTop: 18,
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            maxWidth: 1000,
          }}
        >
          {copy.meta_title}
        </span>
        <span
          style={{
            marginTop: 24,
            fontSize: 26,
            lineHeight: 1.45,
            color: "#a1a1aa",
            maxWidth: 980,
          }}
        >
          {copy.examples.inbox.title} · {copy.examples.whatsapp.title} ·{" "}
          {copy.examples.meeting.title}
        </span>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {chips.map((chip) => (
          <span
            key={chip}
            style={{
              fontSize: 20,
              color: "#d4d4d8",
              border: "1px solid #27272a",
              borderRadius: 999,
              padding: "8px 18px",
              background: "#18181b",
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
