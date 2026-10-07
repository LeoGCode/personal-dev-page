import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AiSetup } from "@/components/ai-setup";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ai_setup" });
  const title = t("meta_title");
  const description = t("meta_description");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/ai`,
      languages: {
        en: "/en/ai",
        es: "/es/ai",
        "x-default": "/en/ai",
      },
    },
    // Shared links (WhatsApp, LinkedIn) must not show the home page's
    // title: openGraph/twitter replace the root layout's values entirely.
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: `/${locale}/ai`,
      siteName: SITE_NAME,
      type: "website",
      locale: locale === "es" ? "es_ES" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function AiSetupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AiSetup />;
}
