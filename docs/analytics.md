# Analytics, ad conversions and cookie consent

Same setup as the Nexora landings (`nexora-group/docs/analytics.md` has the full event table), so
one PostHog project reads both sites: every event carries `site: leogcode`, `landing_slug` (the
page: `home`, `ai`, `blog`, `projects`, `collaborate`, `privacy`), `variant: default` and `locale`.

Code: `lib/analytics/` (config, consent store, PostHog wrapper loaded with a dynamic import, ad
tags, Calendly, document-level tracking, Sentry replay gate), `components/analytics/`, the banner
in `app/[locale]/layout.tsx`, the privacy page at `/[locale]/privacy`.

## Consent

- No choice yet, or Reject: PostHog with `persistence: "memory"` (no cookies or storage, no
  session replay); no Meta pixel, no Google Ads tag, no Sentry replay.
- Accept: PostHog persistence and session replay (inputs masked), Meta pixel, Google Ads tag,
  Sentry replay (its integration is added at runtime, not in `instrumentation-client.ts`).
- Withdraw (footer "Cookie settings" or the privacy page): stored ids are deleted and the page
  reloads. The choice is kept in `localStorage["leogcode-consent-v1"]`.

The CSP in `next.config.ts` allows exactly these hosts; add a host there before adding a vendor.

## Events on this site

| Event                                                            | Where                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `$pageview`, `$pageleave`, autocapture                           | every page (heatmaps, rage and dead clicks on)                         |
| `section_viewed`                                                 | `/ai`: `hero`, `case`, `how`, `packages`, `contact` (`data-section`)   |
| `cta_clicked`                                                    | any Calendly, WhatsApp, mailto or `/collaborate` link, with `location` |
| `booking_opened` / `booking_step` / `booking_scheduled`          | Calendly popup (official widget, UTMs passed through)                  |
| `whatsapp_clicked`                                               | wa.me links (also Meta `Contact`)                                      |
| `outbound_clicked`                                               | links to other hosts (GitHub, LinkedIn, Nexora, Exprime…)              |
| `language_switched`                                              | navbar EN/ES                                                           |
| `lead_form_viewed/submitted/success/error`                       | `/collaborate`, with `form: collaborate` and `collaboration_type`      |
| `project_card_clicked`, `resume_downloaded`, `blog_scroll_depth` | as before                                                              |
| `consent_chosen`                                                 | banner                                                                 |

Conversions after Accept: booking → Meta `Schedule` + Google Ads booking label; lead form
success → Meta `Lead` + Google Ads lead label; WhatsApp → Meta `Contact`.

## Where the ids go (Vercel)

Vercel → project `personal-dev-page` → Settings → Environment Variables, environment
**Production**, then redeploy (Deployments → latest → Redeploy, or push to `main`):

| Variable                               | Value                                                  |
| -------------------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_POSTHOG_KEY`              | PostHog → Project settings → Project API key (`phc_…`) |
| `NEXT_PUBLIC_POSTHOG_HOST`             | optional, defaults to `https://us.i.posthog.com`       |
| `NEXT_PUBLIC_META_PIXEL_ID`            | Meta Events Manager → pixel id                         |
| `NEXT_PUBLIC_META_DOMAIN_VERIFICATION` | Meta Business settings → Domains → meta-tag `content`  |
| `NEXT_PUBLIC_GOOGLE_ADS_ID`            | Google tag id of the Ads account (`AW-…`)              |
| `NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL` | "Booked call" conversion action → tag setup → label    |
| `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL`    | "Lead form" conversion action label                    |

They are inlined by `next build`, so a value only takes effect after a new deployment.

## Checking it

`?__posthog_debug=true` logs PostHog in the console. posthog-js ignores automated browsers
(`navigator.webdriver`, HeadlessChrome); `e2e/analytics.spec.ts` masks both before asserting on
events. The other e2e specs start with a stored cookie choice (`playwright.config.ts`).
