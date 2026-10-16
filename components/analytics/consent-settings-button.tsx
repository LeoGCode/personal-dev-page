"use client";

import { useTranslations } from "next-intl";
import { reopenConsent } from "@/lib/analytics/consent";

/** Reopens the cookie banner so the visitor can change or withdraw a choice. */
export function ConsentSettingsButton({ className }: { className?: string }) {
  const t = useTranslations("consent");
  return (
    <button type="button" onClick={reopenConsent} className={className}>
      {t("change")}
    </button>
  );
}
