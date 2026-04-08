# personal-dev-page

A bilingual (English/Spanish) developer portfolio and lead-generation site built with Next.js 16, React 19, and TypeScript. It serves as both a professional showcase and a full-stack reference architecture — covering CRM integration, transactional email, rate limiting, error tracking, analytics, E2E testing, and CI/CD.

## Tech Stack

| Layer              | Technologies                                                             |
| ------------------ | ------------------------------------------------------------------------ |
| **Framework**      | Next.js 16 (App Router, React Server Components), React 19, TypeScript 6 |
| **Styling**        | Tailwind CSS 4, Radix UI, Shadcn UI components, Motion (Framer Motion)   |
| **Content**        | MDX with Rehype Pretty Code (Shiki), Gray Matter frontmatter             |
| **Forms**          | React Hook Form, Zod validation, rate-limited submissions                |
| **Email**          | Resend + React Email templates (Mailpit for local dev)                   |
| **CRM**            | Odoo XML-RPC integration (optional)                                      |
| **Rate Limiting**  | Dual backend — Upstash Redis (serverless) / in-memory (self-hosted)      |
| **i18n**           | next-intl with URL-based routing (`/en`, `/es`)                          |
| **Analytics**      | PostHog                                                                  |
| **Error Tracking** | Sentry (server + client, source maps, tunnel route)                      |
| **Testing**        | Vitest (unit), Playwright (E2E — desktop + mobile), Storybook            |
| **CI/CD**          | GitHub Actions (lint, format, typecheck, test, build)                    |
| **Deployment**     | Vercel (serverless) or Docker (standalone Node.js)                       |

## Features

- **Portfolio & Blog** — Project showcase with status tracking and a technical blog with MDX, syntax highlighting, and reading time estimates.
- **Collaborate Form** — Contact form with validation, rate limiting, confirmation emails, admin notifications, and automatic CRM lead creation.
- **Fully Bilingual** — Every page, component, and content piece is available in English and Spanish via dictionary-based i18n.
- **Production Hardened** — Security headers (CSP, HSTS, X-Frame-Options), Sentry error tracking with ad-blocker bypass tunnel, and PostHog analytics.
- **Accessible** — Built on Radix UI primitives with Storybook a11y addon checks.

## Getting Started

### Prerequisites

- **Node.js 20+**
- **pnpm 10+** — install with `corepack enable && corepack prepare pnpm@latest --activate`
- **Docker** (optional) — only needed for local Mailpit email testing or Odoo CRM

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-username>/personal-dev-page.git
cd personal-dev-page

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env — for local dev, most defaults work out of the box.
```

### Development

```bash
# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

To also run local email testing with Mailpit:

```bash
# Start Mailpit (captures outgoing emails)
docker compose --profile dev up mailpit -d

# Mailpit UI at http://localhost:8025
```

### Other Commands

```bash
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # ESLint
pnpm format:check     # Prettier check
pnpm typecheck        # TypeScript type checking
pnpm test             # Vitest unit tests
pnpm e2e              # Playwright E2E tests
pnpm e2e:video        # Playwright with video recording
pnpm storybook        # Storybook component explorer
```

## Project Structure

```
app/
  api/collaborate/       # Lead submission API route
  [locale]/              # Localized pages (en, es)
    blog/                # Blog listing & article pages
    projects/            # Project listing & detail pages
    collaborate/         # Contact form page
    page.tsx             # Home

components/
  ui/                    # Shadcn-style primitives (Button, Card, Input, ...)
  hero.tsx               # Hero section
  navbar.tsx             # Navigation
  ...                    # ~37 components total

lib/
  blog.ts                # MDX blog post parsing
  email/                 # Resend / Mailpit email service
  i18n/                  # next-intl routing, navigation, request config
  odoo.ts                # Odoo CRM XML-RPC client
  rate-limit.ts          # Dual-backend rate limiter
  schemas/               # Zod validation schemas

content/
  blog/                  # MDX posts — {slug}.{locale}.mdx
  projects/index.ts      # TypeScript project catalog

dictionaries/            # i18n translation files (en.json, es.json)

e2e/                     # Playwright E2E tests
__tests__/               # Vitest unit tests
.storybook/              # Storybook configuration
.github/workflows/       # CI pipeline
docs/                    # Deployment guide & architecture docs
```

## Testing

**Unit tests** (Vitest) cover utilities, rate limiting logic, and form validation schemas:

```bash
pnpm test
```

**E2E tests** (Playwright) cover full user flows across desktop and mobile viewports:

```bash
pnpm e2e
```

**Component explorer** (Storybook) with a11y checks and Vitest integration:

```bash
pnpm storybook
```

## Deployment

The project supports two deployment targets from the same codebase:

| Target     | Best for                                                                     |
| ---------- | ---------------------------------------------------------------------------- |
| **Vercel** | Zero-config serverless — static pages on CDN, API routes as Lambda functions |
| **Docker** | Self-hosted — standalone Node.js server behind a reverse proxy               |

### Quick Start — Docker

```bash
docker build -t personal-dev-page .
docker run -p 3000:3000 --env-file .env personal-dev-page
```

### Quick Start — Vercel

Connect your GitHub repo at [vercel.com/new](https://vercel.com/new), set environment variables in the dashboard, and deploy.

For the full deployment guide — including environment variable reference, Upstash Redis setup, Odoo CRM integration, and architecture decisions — see **[docs/deployment.md](docs/deployment.md)**.

## Environment Variables

Copy `.env.example` to `.env` for a complete reference. Key variables:

| Variable                  | Required   | Description                                |
| ------------------------- | ---------- | ------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`    | Yes        | Canonical site URL                         |
| `NEXT_PUBLIC_SENTRY_DSN`  | Production | Sentry DSN for error tracking              |
| `RESEND_API_KEY`          | Production | Resend API key for email delivery          |
| `UPSTASH_REDIS_REST_URL`  | Vercel     | Upstash Redis for serverless rate limiting |
| `ODOO_URL`                | No         | Odoo CRM instance (leave empty to skip)    |
| `NEXT_PUBLIC_POSTHOG_KEY` | No         | PostHog analytics key                      |

See [`.env.example`](.env.example) for all variables and [`docs/deployment.md`](docs/deployment.md) for detailed descriptions.

## License

All rights reserved.
