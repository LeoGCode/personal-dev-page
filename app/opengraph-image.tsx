import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Leonel — Full-Stack Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
 * Default Open Graph image for all pages.
 *
 * Design: dark background with a constellation/network-graph pattern
 * of glowing dots on the right, clean typography on the left.
 * Rendered as SVG → PNG by Next.js ImageResponse (Satori + resvg).
 */

/** Constellation dots — scattered across the right side of the image. */
const DOTS: { x: number; y: number; s: number; o: number }[] = [
  // Top band
  { x: 730, y: 55, s: 5, o: 0.2 },
  { x: 820, y: 80, s: 7, o: 0.35 },
  { x: 920, y: 42, s: 10, o: 0.5 },
  { x: 1010, y: 75, s: 6, o: 0.3 },
  { x: 1090, y: 50, s: 12, o: 0.55 },
  { x: 1155, y: 95, s: 4, o: 0.18 },
  // Upper-mid band
  { x: 760, y: 165, s: 12, o: 0.6 },
  { x: 860, y: 145, s: 6, o: 0.3 },
  { x: 955, y: 185, s: 14, o: 0.7 },
  { x: 1045, y: 155, s: 7, o: 0.35 },
  { x: 1130, y: 195, s: 9, o: 0.45 },
  // Middle band
  { x: 790, y: 265, s: 7, o: 0.3 },
  { x: 885, y: 285, s: 10, o: 0.5 },
  { x: 975, y: 255, s: 6, o: 0.25 },
  { x: 1065, y: 295, s: 13, o: 0.65 },
  { x: 1150, y: 275, s: 5, o: 0.2 },
  // Lower-mid band
  { x: 750, y: 375, s: 8, o: 0.4 },
  { x: 845, y: 395, s: 6, o: 0.25 },
  { x: 940, y: 365, s: 11, o: 0.55 },
  { x: 1035, y: 405, s: 7, o: 0.3 },
  { x: 1120, y: 375, s: 9, o: 0.4 },
  // Bottom band
  { x: 785, y: 485, s: 6, o: 0.22 },
  { x: 875, y: 505, s: 9, o: 0.4 },
  { x: 965, y: 475, s: 7, o: 0.3 },
  { x: 1055, y: 515, s: 10, o: 0.45 },
  { x: 1135, y: 495, s: 5, o: 0.18 },
  // Tiny scatter (depth)
  { x: 705, y: 130, s: 3, o: 0.12 },
  { x: 1165, y: 440, s: 3, o: 0.12 },
  { x: 720, y: 430, s: 3, o: 0.12 },
  { x: 1080, y: 120, s: 3, o: 0.12 },
  { x: 810, y: 340, s: 3, o: 0.1 },
  { x: 1000, y: 340, s: 3, o: 0.1 },
];

/** Edges connecting nearby nodes for the network effect. */
const EDGES: { x1: number; y1: number; x2: number; y2: number; o: number }[] =
  [
    // Top connections
    { x1: 820, y1: 80, x2: 920, y2: 42, o: 0.1 },
    { x1: 920, y1: 42, x2: 1010, y2: 75, o: 0.08 },
    { x1: 1010, y1: 75, x2: 1090, y2: 50, o: 0.1 },
    { x1: 730, y1: 55, x2: 820, y2: 80, o: 0.06 },
    // Top to upper-mid
    { x1: 820, y1: 80, x2: 760, y2: 165, o: 0.08 },
    { x1: 920, y1: 42, x2: 955, y2: 185, o: 0.1 },
    { x1: 1090, y1: 50, x2: 1130, y2: 195, o: 0.08 },
    { x1: 1010, y1: 75, x2: 1045, y2: 155, o: 0.07 },
    // Upper-mid connections
    { x1: 760, y1: 165, x2: 860, y2: 145, o: 0.09 },
    { x1: 860, y1: 145, x2: 955, y2: 185, o: 0.12 },
    { x1: 955, y1: 185, x2: 1045, y2: 155, o: 0.1 },
    { x1: 1045, y1: 155, x2: 1130, y2: 195, o: 0.08 },
    // Upper-mid to middle
    { x1: 760, y1: 165, x2: 790, y2: 265, o: 0.07 },
    { x1: 955, y1: 185, x2: 885, y2: 285, o: 0.1 },
    { x1: 1045, y1: 155, x2: 1065, y2: 295, o: 0.09 },
    { x1: 1130, y1: 195, x2: 1150, y2: 275, o: 0.06 },
    // Middle connections
    { x1: 790, y1: 265, x2: 885, y2: 285, o: 0.08 },
    { x1: 885, y1: 285, x2: 975, y2: 255, o: 0.1 },
    { x1: 975, y1: 255, x2: 1065, y2: 295, o: 0.12 },
    { x1: 1065, y1: 295, x2: 1150, y2: 275, o: 0.07 },
    // Middle to lower-mid
    { x1: 790, y1: 265, x2: 750, y2: 375, o: 0.06 },
    { x1: 885, y1: 285, x2: 940, y2: 365, o: 0.09 },
    { x1: 1065, y1: 295, x2: 1035, y2: 405, o: 0.08 },
    { x1: 1150, y1: 275, x2: 1120, y2: 375, o: 0.06 },
    // Lower-mid connections
    { x1: 750, y1: 375, x2: 845, y2: 395, o: 0.07 },
    { x1: 845, y1: 395, x2: 940, y2: 365, o: 0.1 },
    { x1: 940, y1: 365, x2: 1035, y2: 405, o: 0.09 },
    { x1: 1035, y1: 405, x2: 1120, y2: 375, o: 0.07 },
    // Lower-mid to bottom
    { x1: 750, y1: 375, x2: 785, y2: 485, o: 0.05 },
    { x1: 940, y1: 365, x2: 965, y2: 475, o: 0.08 },
    { x1: 1035, y1: 405, x2: 1055, y2: 515, o: 0.07 },
    { x1: 1120, y1: 375, x2: 1135, y2: 495, o: 0.05 },
    // Bottom connections
    { x1: 785, y1: 485, x2: 875, y2: 505, o: 0.06 },
    { x1: 875, y1: 505, x2: 965, y2: 475, o: 0.08 },
    { x1: 965, y1: 475, x2: 1055, y2: 515, o: 0.1 },
    { x1: 1055, y1: 515, x2: 1135, y2: 495, o: 0.06 },
  ];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0a0a0a",
          overflow: "hidden",
        }}
      >
        {/* ── SVG constellation / network graph ───────────────── */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Edges first (behind dots) */}
          {EDGES.map((e, i) => (
            <line
              key={`e-${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={`rgba(74,222,128,${e.o})`}
              strokeWidth="1"
            />
          ))}

          {/* Nodes */}
          {DOTS.map((d, i) => (
            <circle
              key={`d-${i}`}
              cx={d.x}
              cy={d.y}
              r={d.s}
              fill={`rgba(74,222,128,${d.o})`}
            />
          ))}

          {/* Larger glow on key nodes */}
          <circle cx={955} cy={185} r={28} fill="rgba(74,222,128,0.06)" />
          <circle cx={1065} cy={295} r={24} fill="rgba(74,222,128,0.05)" />
          <circle cx={1090} cy={50} r={20} fill="rgba(74,222,128,0.04)" />
          <circle cx={940} cy={365} r={22} fill="rgba(74,222,128,0.05)" />
        </svg>

        {/* ── Content area ────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            height: "100%",
            padding: "60px 72px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Accent bar */}
          <div
            style={{
              width: 4,
              height: 240,
              borderRadius: 4,
              background: "#4ade80",
              flexShrink: 0,
            }}
          />

          {/* Text block */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: 36,
              maxWidth: 580,
            }}
          >
            {/* Site URL */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#4ade80",
                }}
              />
              <span style={{ fontSize: 16, color: "#52525b" }}>
                leogcode.dev
              </span>
            </div>

            {/* Name */}
            <span
              style={{
                fontSize: 68,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              Leonel
            </span>

            {/* Title */}
            <span
              style={{
                fontSize: 30,
                fontWeight: 600,
                color: "#4ade80",
                marginTop: 12,
                lineHeight: 1.2,
              }}
            >
              Full-Stack Engineer
            </span>

            {/* Description */}
            <span
              style={{
                fontSize: 18,
                color: "#a1a1aa",
                marginTop: 24,
                lineHeight: 1.65,
              }}
            >
              I ship products end-to-end and leverage AI, agents, and LLMs to
              make them 10x more powerful.
            </span>

            {/* Tech tags */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 32,
                flexWrap: "wrap",
              }}
            >
              {["Next.js", "TypeScript", "Python", "AI / LLM", "Docker"].map(
                (tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 13,
                      color: "#71717a",
                      border: "1px solid #27272a",
                      borderRadius: 20,
                      padding: "5px 14px",
                      background: "#18181b",
                    }}
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
