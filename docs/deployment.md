# Deployment Guide

This project supports two deployment targets with the same codebase:

| Target                   | How it works                                     | When to use                                |
| ------------------------ | ------------------------------------------------ | ------------------------------------------ |
| **Vercel**               | Static pages on CDN + serverless functions       | Easiest path, zero infra management        |
| **Docker (self-hosted)** | Standalone Node.js server behind a reverse proxy | Full control, private network integrations |

---

## Vercel Deployment

### What Vercel does with your Next.js app

There is no persistent Node.js server. Vercel splits the build output into:

- **Static assets** (HTML, CSS, JS, images) → served from a global CDN edge network.
  All pages using `generateStaticParams` (home, blog, projects) are pre-rendered
  at build time and served as static files — no compute, no cold starts.

- **Serverless functions** (API routes, dynamic pages) → AWS Lambda functions that
  spin up per-request and shut down after. The only function in this project is
  `POST /api/collaborate`.

- **Edge functions** (middleware, if any) → V8 isolates at the CDN edge. This
  project has no custom middleware.

### Setup

1. **Connect your GitHub repo** to Vercel at [vercel.com/new](https://vercel.com/new).
   Vercel auto-detects Next.js and configures the build command (`pnpm run build`).

2. **Set environment variables** in the Vercel dashboard (Settings → Environment Variables).
   See the [Environment Variables](#environment-variables) section below.

3. **Set up Upstash Redis** for rate limiting (recommended):
   - Create a free Redis database at [upstash.com](https://upstash.com)
     (or via the Vercel integration marketplace).
   - Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel env vars.
   - Without Upstash, rate limiting falls back to in-memory, which is unreliable
     on serverless (each invocation may get a fresh instance with an empty counter).

4. **Deploy.** Vercel runs `pnpm run build` (which also runs `postbuild` for sitemap
   generation) and deploys automatically.

### Architectural decisions for Vercel

| Decision                                                         | Rationale                                                                                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `output: "standalone"` is **conditional** (`STANDALONE` env var) | Vercel uses its own build adapter — standalone output is only needed for Docker. The Dockerfile sets `STANDALONE=true` automatically.                                                                                          |
| Rate limiter has **dual backends** (memory / Upstash Redis)      | In-memory `Map` does not persist across serverless invocations. Upstash Redis provides durable, cross-invocation rate limiting over HTTP (no TCP connections). Selected automatically based on `UPSTASH_REDIS_REST_URL`.       |
| Odoo CRM is **optional**                                         | On Vercel, your Odoo instance may not be reachable (private network). When Odoo env vars are unset, `createCrmLead()` logs a message and returns `null` instead of crashing. Leads are still captured via email notifications. |
| `after()` API for background work                                | Vercel supports `after()` — the serverless function stays alive after sending the response to complete CRM sync and email delivery. No changes needed.                                                                         |
| Sentry tunnel (`/monitoring`)                                    | Works on Vercel as a serverless function. Proxies error reports to Sentry, bypassing ad blockers.                                                                                                                              |
| Security headers in `next.config.ts`                             | Applied by Vercel's CDN layer — identical behavior to self-hosted.                                                                                                                                                             |
| `NEXT_PUBLIC_*` vars are **build-time**                          | Vercel inlines these into the client bundle during build. They must be set before deploying, not just at runtime.                                                                                                              |

---

## Docker (Self-Hosted) Deployment

### How it works

The Dockerfile produces a standalone Node.js server via `output: "standalone"`.
This bundles only the required `node_modules` into a minimal image.

```
Reverse Proxy (Traefik/Nginx/Cloudflare)
       │
       ▼
  Docker container (node server.js on port 3000)
       │
       ├── Serves pre-rendered static pages
       ├── Handles API routes (collaborate form)
       └── Connects to Odoo CRM on private network
```

### Build and run

```bash
docker build -t personal-dev-page .
docker run -p 3000:3000 --env-file .env personal-dev-page
```

### Self-hosted decisions

| Decision                                          | Rationale                                                                                                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate limiting uses **in-memory** `Map` by default | For a single-instance deployment, in-memory is correct — no external dependency needed. Counters reset on restart, which is acceptable for a contact form. |
| Odoo connects over **private network**            | The Docker Compose setup puts Odoo and the app on the same network. No public exposure of Odoo credentials.                                                |
| `STANDALONE=true` set in Dockerfile               | Tells `next.config.ts` to produce standalone output.                                                                                                       |

### Recommended: put a CDN in front

Even with a self-hosted server, put Cloudflare (free tier) or similar in front.
The CDN caches static pages at the edge, so your server only handles cache misses
and API requests. This gives you CDN-level performance with self-hosted control.

---

## Environment Variables

### Required for all deployments

| Variable                 | Build/Runtime | Description                                                                                        |
| ------------------------ | ------------- | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`   | Build         | Canonical site URL (e.g. `https://leogcode.dev`). Used for CORS validation, sitemap, and metadata. |
| `NEXT_PUBLIC_SENTRY_DSN` | Build         | Sentry DSN for error tracking. **Required in production** — the app throws on startup if missing.  |
| `SENTRY_ORG`             | Build         | Sentry organization slug (for source map uploads during build).                                    |
| `SENTRY_PROJECT`         | Build         | Sentry project slug.                                                                               |
| `SENTRY_AUTH_TOKEN`      | Build         | Sentry auth token (for source map uploads).                                                        |
| `RESEND_API_KEY`         | Runtime       | Resend API key for sending emails.                                                                 |
| `EMAIL_FROM`             | Runtime       | Sender address for emails (e.g. `Leonel <hello@leogcode.dev>`).                                    |

### Recommended

| Variable                   | Build/Runtime | Description                                                                                                              |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `NOTIFICATION_EMAIL`       | Runtime       | Email address to receive lead notifications. Leave empty to disable admin notifications (user confirmation still sends). |
| `NEXT_PUBLIC_POSTHOG_KEY`  | Build         | PostHog project API key for analytics.                                                                                   |
| `NEXT_PUBLIC_POSTHOG_HOST` | Build         | PostHog instance URL.                                                                                                    |
| `UPSTASH_REDIS_REST_URL`   | Runtime       | Upstash Redis REST URL. **Required on Vercel** for reliable rate limiting. Leave empty for in-memory (self-hosted).      |
| `UPSTASH_REDIS_REST_TOKEN` | Runtime       | Upstash Redis REST token.                                                                                                |

### Optional

| Variable                | Build/Runtime | Description                                                                        |
| ----------------------- | ------------- | ---------------------------------------------------------------------------------- |
| `ODOO_URL`              | Runtime       | Odoo instance URL. Leave empty to skip CRM integration.                            |
| `ODOO_DB`               | Runtime       | Odoo database name.                                                                |
| `ODOO_USER`             | Runtime       | Odoo username.                                                                     |
| `ODOO_PASSWORD`         | Runtime       | Odoo password.                                                                     |
| `ODOO_PERSONAL_TEAM_ID` | Runtime       | Odoo CRM team ID for lead assignment.                                              |
| `RATE_LIMIT_MAX`        | Runtime       | Max form submissions per IP per hour (default: `3`).                               |
| `STANDALONE`            | Build         | Set to `"true"` for Docker standalone builds. Set automatically by the Dockerfile. |

> **Note on `NEXT_PUBLIC_*` variables:** These are inlined into the JavaScript
> bundle at build time. On Vercel, set them in the dashboard **before** deploying.
> Changing them requires a redeploy.
