@AGENTS.md

# Personal Developer Page

Personal portfolio and collaboration hub for Leonel. Built with Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, and TypeScript.

## Architecture

- **Framework:** Next.js 16 with App Router, standalone output for Docker
- **Styling:** Tailwind CSS v4 (PostCSS-based, no tailwind.config), shadcn/ui components
- **i18n:** next-intl with EN/ES locales, locale prefix routing (`/en/...`, `/es/...`)
- **Database:** PostgreSQL 18 via Drizzle ORM
- **CRM:** Odoo 18 Community Edition via JSON-RPC (shared with Nexora)
- **Email:** Resend (production), Mailpit (local dev)
- **Cache:** Redis for rate limiting
- **Animations:** Motion (formerly Framer Motion)

## Next.js 16 Breaking Changes

- **Proxy, not Middleware:** `proxy.ts` replaces `middleware.ts`. Export `proxy()` not `middleware()`.
- **Async params:** `params` and `searchParams` in layouts/pages are Promises — always `await` them.
- **Turbopack default:** Webpack is no longer default. Custom webpack configs require `--webpack` flag.

## Project Structure

```
app/
├── [locale]/          # EN/ES locale routing
│   ├── page.tsx       # Homepage
│   ├── projects/      # Projects listing + detail
│   ├── collaborate/   # Collaboration form
│   └── blog/          # MDX blog
├── api/collaborate/   # Form submission → Odoo CRM
globals.css            # Tailwind v4 + CSS variables (dark mode default)
components/            # Page components + shadcn/ui primitives
lib/                   # Odoo client, DB, schemas, i18n, utils
dictionaries/          # en.json, es.json
content/               # MDX blog posts + project data
```

## Conventions

- TypeScript strict mode, path alias `@/*` → project root
- Components in `components/`, shadcn/ui primitives in `components/ui/`
- Translations in `dictionaries/{en,es}.json`, accessed via `useTranslations()`
- Odoo leads tagged: `source:personal-site`, `type:{collab-type}`, `lang:{locale}`
- Forms: React Hook Form + Zod validation, honeypot for spam, Redis rate limiting
- Dark mode default, light mode toggle. Emerald accent color for CTAs.
- Blog: MDX files in `content/blog/`, frontmatter with gray-matter

## Commands

```bash
npm run checks             # Run all checks (ESLint, build)
npm run lint               # ESLint
npm run build              # Production build
npm run dev                # Start dev server (Turbopack)
npm run start              # Start production server
npx drizzle-kit generate   # Generate DB migrations
npx drizzle-kit migrate    # Run DB migrations
```

## Shared Infrastructure

This app runs as a container in the Nexora Docker Compose stack on a shared Hetzner VPS.
Shares: PostgreSQL, Redis, Odoo, PostHog, Uptime Kuma, Traefik, CrowdSec, backup strategy.
