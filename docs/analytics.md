# Analytics, ad conversions and cookie consent

PostHog was never active on this site before 2026-10-16 (no key on Vercel); the project is now
PostHog US "Web" (id 669400), shared with the Nexora landings.

Same setup as the Nexora landings (`nexora-group/docs/analytics.md` has the full event table), so
one PostHog project reads both sites: every event carries `site: leogcode`, `landing_slug` (the
page: `home`, `ai`, `blog`, `projects`, `collaborate`, `privacy`), `variant: default` and `locale`.

Code: `lib/analytics/` (config, consent store, PostHog wrapper loaded with a dynamic import, ad
tags, Calendly, document-level tracking, Sentry replay gate), `components/analytics/`, the banner
in `app/[locale]/layout.tsx`, the privacy page at `/[locale]/privacy`.

## Consent

- No choice yet: whatever `BEFORE_CHOICE` in `lib/analytics/config.ts` allows. That constant is
  the one switch (the banner and the privacy page take their text from it). Now
  `anonymous_counts`: only `$pageview`, `cta_clicked`, `booking_opened`, `booking_scheduled` and
  `lead_form_viewed/submitted/success`, through a second PostHog instance in cookieless mode (no
  cookie, no storage, no id on the device, no person profile, no autocapture, no replay). PostHog
  counts unique visitors with its daily server-side hash; **"Cookieless server hash mode" must be
  on in PostHog → Project settings → Web analytics**, or PostHog drops these events. The other
  value, `nothing`, keeps PostHog off until Accept. No Meta pixel, Google Ads tag or Sentry replay.
- Reject: nothing is loaded or sent, not even the click on Reject.
- Accept: PostHog persistence and session replay (inputs masked), Meta pixel, Google Ads tag,
  Sentry replay (its integration is added at runtime, not in `instrumentation-client.ts`).
- Withdraw (footer "Cookie settings" or the privacy page): capture and both replays stop at once,
  the ad tags are told to stop, stored ids are deleted, and the tab where it was clicked reloads.
- The choice is kept in `localStorage["leogcode-consent-v1"]`; every open tab follows a change
  made in another (`storage` event), including stopping replay, ad tags and capture.

Every URL PostHog sends (`$current_url`, `$referrer`, `$initial_*`, autocaptured hrefs, replay
meta events, our own `url` properties) keeps only origin + path + `utm_*`, `gclid`, `fbclid`
(`lib/analytics/sanitize.ts`, the `before_send` hook). Calendly loads nothing before a booking
click. A booking is counted once per Calendly id, sent as `booking_id`, Meta `eventID` and Google
`transaction_id`; without an id nothing is sent.

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
| `lead_form_viewed/submitted/success/error`                       | `/collaborate` (viewed: half the form on screen, once per page view)   |
| `project_card_clicked`, `resume_downloaded`, `blog_scroll_depth` | as before                                                              |
| `consent_chosen`                                                 | banner Accept (Reject sends nothing)                                   |

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
events and covers every consent state (no choice, Accept, Reject, withdraw, two tabs), URL
sanitizing and booking dedupe. The other e2e specs start with a stored cookie choice (`playwright.config.ts`).
