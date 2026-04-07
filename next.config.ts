import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // Sentry org & project (set via env or replace with your values)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Source map upload for readable stack traces
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Route client reports through your server to avoid ad-blockers
  tunnelRoute: "/monitoring",

  // Only log upload progress in CI
  silent: !process.env.CI,
});
