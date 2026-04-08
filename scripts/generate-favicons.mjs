#!/usr/bin/env node

/**
 * generate-favicons.mjs
 *
 * Converts public/favicon.svg into every favicon asset a modern site needs:
 *   - favicon.ico       (multi-size: 16 + 32 + 48)
 *   - favicon-16x16.png
 *   - favicon-32x32.png
 *   - favicon-48x48.png
 *   - apple-touch-icon.png  (180x180)
 *   - android-chrome-192x192.png
 *   - android-chrome-512x512.png
 *
 * Requirements: sharp (already a Next.js dep)
 *
 * Usage:
 *   node scripts/generate-favicons.mjs
 */

import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SVG_PATH = resolve(ROOT, "public/favicon.svg");
const OUT_DIR = resolve(ROOT, "app");
const PUBLIC_DIR = resolve(ROOT, "public");

// ── Helpers ──────────────────────────────────────────────────────────

/** Render the SVG source to a sharp PNG pipeline at the given size. */
function svgToPng(svgBuffer, size) {
  return sharp(svgBuffer, { density: 400 })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png();
}

/**
 * Build a minimal ICO file from one or more raw PNG buffers.
 *
 * ICO format (simplified):
 *   - 6-byte header
 *   - 16-byte directory entry per image
 *   - Raw PNG data for each image
 *
 * Using PNG-in-ICO (type 1) which is supported by all modern browsers.
 */
function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * count;
  let dataOffset = headerSize + dirSize;

  // ICO header: reserved (2) + type (2) + count (2)
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = ICO
  header.writeUInt16LE(count, 4); // image count

  const dirEntries = [];
  const sizes = [16, 32, 48];

  for (let i = 0; i < count; i++) {
    const png = pngBuffers[i];
    const size = sizes[i] || 0;
    const entry = Buffer.alloc(dirEntrySize);

    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8); // image data size
    entry.writeUInt32LE(dataOffset, 12); // offset to image data

    dirEntries.push(entry);
    dataOffset += png.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Reading SVG source …");
  const svgBuffer = readFileSync(SVG_PATH);

  // Generate PNGs at every needed size
  const pngSizes = [16, 32, 48, 180, 192, 512];
  const pngMap = {};

  console.log("Rendering PNGs …");
  await Promise.all(
    pngSizes.map(async (size) => {
      const buf = await svgToPng(svgBuffer, size).toBuffer();
      pngMap[size] = buf;
    }),
  );

  // Write individual PNG files
  const pngOutputs = [
    { size: 16, name: "favicon-16x16.png", dir: PUBLIC_DIR },
    { size: 32, name: "favicon-32x32.png", dir: PUBLIC_DIR },
    { size: 48, name: "favicon-48x48.png", dir: PUBLIC_DIR },
    { size: 180, name: "apple-touch-icon.png", dir: PUBLIC_DIR },
    { size: 192, name: "android-chrome-192x192.png", dir: PUBLIC_DIR },
    { size: 512, name: "android-chrome-512x512.png", dir: PUBLIC_DIR },
  ];

  for (const { size, name, dir } of pngOutputs) {
    const outPath = resolve(dir, name);
    writeFileSync(outPath, pngMap[size]);
    console.log(`  ✓ ${name}  (${size}×${size})`);
  }

  // Build and write the ICO
  console.log("Building favicon.ico …");
  const icoBuffer = buildIco([pngMap[16], pngMap[32], pngMap[48]]);
  const icoPath = resolve(OUT_DIR, "favicon.ico");
  writeFileSync(icoPath, icoBuffer);
  console.log(`  ✓ favicon.ico  (16 + 32 + 48)`);

  console.log("\nDone! All favicon assets generated.\n");

  // Print suggested metadata additions
  console.log(
    "Add this to your <head> or Next.js metadata (if not already present):",
  );
  console.log(`
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
