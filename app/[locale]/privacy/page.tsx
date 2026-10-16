import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConsentSettingsButton } from "@/components/analytics/consent-settings-button";
import { BEFORE_CHOICE } from "@/lib/analytics/config";
import { SITE_EMAIL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return {
    title: t("meta_title"),
    description: t("meta_description"),
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: { en: "/en/privacy", es: "/es/privacy" },
    },
  };
}

/** Sections that are just a title and a paragraph, in page order. */
const TEXT_SECTIONS = ["form", "analytics", "ads", "booking"] as const;

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("privacy");
  const services = t.raw("services.items") as string[];

  const h2 = "font-mono text-lg font-semibold text-foreground";

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("updated")}</p>
        <p className="mt-8 leading-relaxed text-muted-foreground">
          {t("intro")}
        </p>

        <div className="mt-10 space-y-10 leading-relaxed text-muted-foreground">
          {TEXT_SECTIONS.map((key) => (
            <section key={key} className="space-y-3">
              <h2 className={h2}>{t(`${key}.title`)}</h2>
              <p>{t(`${key}.text`)}</p>
            </section>
          ))}

          <section className="space-y-3">
            <h2 className={h2}>{t("cookies.title")}</h2>
            <p>{t("cookies.intro")}</p>
            {/* Follows the BEFORE_CHOICE switch in lib/analytics/config.ts. */}
            {(
              [
                ["beforeChoiceTitle", `beforeChoice.${BEFORE_CHOICE}`],
                ["rejectTitle", "reject"],
                ["acceptTitle", "accept"],
              ] as const
            ).map(([title, text]) => (
              <div key={title}>
                <h3 className="font-medium text-foreground">
                  {t(`cookies.${title}`)}
                </h3>
                <p>{t(`cookies.${text}`)}</p>
              </div>
            ))}
            <p>{t("cookies.text")}</p>
            <ConsentSettingsButton className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent" />
          </section>

          <section className="space-y-3">
            <h2 className={h2}>{t("services.title")}</h2>
            <ul className="list-disc space-y-2 pl-5">
              {services.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className={h2}>{t("retention.title")}</h2>
            <p>{t("retention.text")}</p>
          </section>

          <section className="space-y-3">
            <h2 className={h2}>{t("rights.title")}</h2>
            <p>{t("rights.text")}</p>
          </section>

          <section className="space-y-3">
            <h2 className={h2}>{t("contact.title")}</h2>
            <p>
              <a
                href={`mailto:${SITE_EMAIL}`}
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                {SITE_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
