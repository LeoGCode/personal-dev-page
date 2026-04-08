/**
 * Domain fallback — keep in sync with lib/site.ts (SITE_DOMAIN).
 * This file is CJS and can't import the TS config directly.
 */
const FALLBACK_URL = "https://leogcode.dev";

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL,
  generateRobotsTxt: true,
  exclude: ["/api/*"],
  alternateRefs: [
    {
      href: `${process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL}/en`,
      hreflang: "en",
    },
    {
      href: `${process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL}/es`,
      hreflang: "es",
    },
  ],
};
