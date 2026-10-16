"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { setConsent, useConsent } from "@/lib/analytics/consent";
import { track } from "@/lib/analytics/track";

/**
 * Cookie banner: Accept and Reject are the same size and style, the choice is
 * remembered, and the page stays usable while it shows (no overlay).
 */
export function ConsentBanner() {
  const consent = useConsent();
  const t = useTranslations("consent");

  if (!consent?.open) return null;

  function choose(choice: "granted" | "denied") {
    track("consent_chosen", { choice });
    setConsent(choice);
  }

  return (
    <section
      aria-label={t("label")}
      data-testid="consent-banner"
      className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-[420px]"
    >
      <p className="text-sm leading-relaxed text-card-foreground/90">
        {t("text")}{" "}
        <Link
          href="/privacy"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          {t("privacy")}
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1"
          onClick={() => choose("denied")}
        >
          {t("reject")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1"
          onClick={() => choose("granted")}
        >
          {t("accept")}
        </Button>
      </div>
    </section>
  );
}
