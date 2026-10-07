"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePostHog } from "posthog-js/react";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ExternalLink,
  Inbox,
  Mail,
  MessageCircle,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AnimateInView } from "@/components/animate-in-view";
import { AI_PACKAGES_URL, BOOKING_URL, WHATSAPP_NUMBER } from "@/lib/site";

const CHIPS = ["not_course", "any_ai", "bilingual", "dfw"] as const;

const EXAMPLES = [
  { key: "inbox", icon: Inbox },
  { key: "whatsapp", icon: MessageCircle },
  { key: "meeting", icon: Mic },
] as const;

const STEPS = ["call", "setup", "handover", "yours"] as const;

const ASKS = ["testimonial", "recording", "intro"] as const;

type Cta = "book_call" | "whatsapp" | "write" | "packages";
type Placement = "hero" | "final";

/** Bigger tap targets on phones; buttons wrap instead of overflowing. */
const ctaButtonClass =
  "group h-auto min-h-11 w-full whitespace-normal py-2.5 text-base sm:w-auto";

const sectionTitleClass =
  "font-mono text-2xl font-bold tracking-tight sm:text-3xl";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function BookCallButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button asChild size="lg" className={ctaButtonClass}>
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        <CalendarCheck aria-hidden="true" />
        {children}
        <ArrowRight
          className="transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </a>
    </Button>
  );
}

function WhatsAppButton({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button asChild size="lg" variant="outline" className={ctaButtonClass}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        <WhatsAppIcon className="text-[#25D366]" />
        {children}
      </a>
    </Button>
  );
}

/**
 * /ai — AI setup page for people Leonel knows (QR code, WhatsApp shares).
 * Phone-first, one scroll: what it does, how it works, the founding-client
 * offer and the ways to get in touch.
 */
export function AiSetup() {
  const t = useTranslations("ai_setup");
  const locale = useLocale();
  const posthog = usePostHog();

  const whatsappUrl = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t("whatsapp_message"))}`
    : null;
  const packagesUrl = `${AI_PACKAGES_URL}/${locale}#packages`;
  // An empty `ai_setup.offer.price` string hides the price block.
  const price = t("offer.price");
  const priceNote = t("offer.price_note");

  function track(cta: Cta, placement: Placement, url: string) {
    posthog?.capture("ai_page_cta_clicked", { cta, placement, url, locale });
  }

  return (
    <div className="px-4 pb-20 pt-10 sm:pt-16">
      <div className="mx-auto max-w-4xl">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="max-w-2xl">
          <p className="mb-3 font-mono text-sm text-primary">
            {t("hero.eyebrow")}
          </p>
          <h1 className="font-mono text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <BookCallButton
              onClick={() => track("book_call", "hero", BOOKING_URL)}
            >
              {t("hero.cta")}
            </BookCallButton>
            {whatsappUrl && (
              <WhatsAppButton
                href={whatsappUrl}
                onClick={() => track("whatsapp", "hero", whatsappUrl)}
              >
                {t("whatsapp_cta")}
              </WhatsAppButton>
            )}
          </div>
          <ul
            className="mt-6 flex flex-wrap gap-2"
            aria-label={t("chips.label")}
          >
            {CHIPS.map((key) => (
              <li
                key={key}
                className="rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground"
              >
                {t(`chips.${key}`)}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Examples + real case ─────────────────────────────── */}
        <section aria-labelledby="ai-examples" className="mt-16 sm:mt-24">
          <AnimateInView>
            <h2 id="ai-examples" className={sectionTitleClass}>
              {t("examples.title")}
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {EXAMPLES.map(({ key, icon: Icon }) => (
                <div
                  key={key}
                  className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm dark:shadow-none"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-mono text-base font-semibold">
                    {t(`examples.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`examples.${key}.text`)}
                  </p>
                </div>
              ))}
            </div>
            <figure className="mt-6 rounded-xl border border-border/60 border-l-[3px] border-l-primary bg-card p-5 sm:p-6">
              <figcaption className="font-mono text-xs uppercase tracking-wider text-primary">
                {t("story.label")}
              </figcaption>
              <p className="mt-2 leading-relaxed">{t("story.text")}</p>
            </figure>
          </AnimateInView>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section aria-labelledby="ai-how" className="mt-16 max-w-2xl sm:mt-24">
          <AnimateInView>
            <h2 id="ai-how" className={sectionTitleClass}>
              {t("how.title")}
            </h2>
            <ol className="mt-8">
              {STEPS.map((key, i) => (
                <li key={key} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-[17px] top-10 w-px bg-border"
                    />
                  )}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-mono text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="font-mono font-semibold">
                      {t(`how.steps.${key}.title`)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t(`how.steps.${key}.text`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </AnimateInView>
        </section>

        {/* ── Founding-client offer ────────────────────────────── */}
        <section aria-labelledby="ai-offer" className="mt-16 sm:mt-24">
          <AnimateInView>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 font-mono text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {t("offer.label")}
              </span>
              <h2 id="ai-offer" className={`mt-4 ${sectionTitleClass}`}>
                {t("offer.title")}
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
                {t("offer.text")}
              </p>
              {price && (
                <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-3xl font-bold sm:text-4xl">
                    {price}
                  </span>
                  {priceNote && (
                    <span className="text-sm text-muted-foreground">
                      {priceNote}
                    </span>
                  )}
                </p>
              )}
              <p className="mt-6 font-medium">{t("offer.asks_title")}</p>
              <ul className="mt-3 space-y-3">
                {ASKS.map((key) => (
                  <li key={key} className="flex gap-3">
                    <Check
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{t(`offer.asks.${key}`)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground">
                {t("offer.requirement")}
              </p>
            </div>
          </AnimateInView>
        </section>

        {/* ── Get in touch ─────────────────────────────────────── */}
        <section
          aria-labelledby="ai-cta"
          className="mx-auto mt-16 max-w-2xl text-center sm:mt-24"
        >
          <h2 id="ai-cta" className={sectionTitleClass}>
            {t("cta.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("cta.text")}</p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <BookCallButton
              onClick={() => track("book_call", "final", BOOKING_URL)}
            >
              {t("cta.primary")}
            </BookCallButton>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={ctaButtonClass}
            >
              <Link
                href="/collaborate?type=ai_setup"
                onClick={() =>
                  track("write", "final", "/collaborate?type=ai_setup")
                }
              >
                <Mail aria-hidden="true" />
                {t("cta.secondary")}
              </Link>
            </Button>
            {whatsappUrl && (
              <WhatsAppButton
                href={whatsappUrl}
                onClick={() => track("whatsapp", "final", whatsappUrl)}
              >
                {t("whatsapp_cta")}
              </WhatsAppButton>
            )}
          </div>
          <a
            href={packagesUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("packages", "final", packagesUrl)}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            {t("cta.packages")}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <p className="mx-auto mt-10 flex max-w-md items-start justify-center gap-2 text-left text-xs text-muted-foreground sm:text-center">
            <ShieldCheck
              className="mt-px h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>{t("cta.privacy")}</span>
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("cta.location")}
          </p>
        </section>
      </div>
    </div>
  );
}
