/**
 * Central site configuration.
 *
 * Every app-level reference to the domain, email, or site name should import
 * from here so there is a single place to update.
 *
 * Non-JS files (docker-compose.yml, CI workflows, .env.example, docs, resume)
 * can't import this module — keep their fallback values in sync manually.
 */

export const SITE_DOMAIN = "leogcode.dev";

const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_DOMAIN}`;
export const SITE_URL = rawUrl.startsWith("http")
  ? rawUrl
  : `https://${rawUrl}`;

export const SITE_NAME = "Leonel";

export const SITE_EMAIL = `hello@${SITE_DOMAIN}`;

export const EMAIL_FROM =
  process.env.EMAIL_FROM || `${SITE_NAME} <${SITE_EMAIL}>`;

export const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "";
