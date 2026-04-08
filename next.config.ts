import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  // "standalone" produces a self-contained Node.js server for Docker.
  // On Vercel this is not needed — Vercel splits the app into static
  // assets (CDN) + serverless functions automatically.  The Dockerfile
  // sets STANDALONE=true so Docker builds still get the standalone output.
  ...(process.env.STANDALONE === "true" && { output: "standalone" as const }),
  experimental: {
    optimizePackageImports: ["lucide-react", "motion/react"],
  },
  async headers() {
    const securityHeaders = [
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      },
    ];

    // CSP is only applied in production — in development React needs
    // eval() for debugging features (stack trace reconstruction, etc.)
    // and a strict CSP blocks it, producing noisy console errors.
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Content-Security-Policy",
        // 'unsafe-inline' is required because Next.js injects inline
        // scripts for streaming (Suspense fallback swaps) and React
        // hydration. Static hashes don't work here — they change every
        // build. A nonce-based CSP via middleware would be stricter but
        // forces all pages to be dynamic, which isn't worth it for a
        // static landing site.
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self'",
          "connect-src 'self' https://*.posthog.com https://*.sentry.io",
          "frame-ancestors 'none'",
        ].join("; "),
      });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
