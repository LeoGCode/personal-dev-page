import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { SkillsGrid } from "@/components/skills-grid";
import { FeaturedProjects } from "@/components/featured-projects";
import { CTABanner } from "@/components/cta-banner";
import { AnimateInView } from "@/components/animate-in-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    title: t("meta_title"),
    description: t("meta_description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        es: "/es",
      },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <AnimateInView>
        <About />
      </AnimateInView>
      <AnimateInView delay={0.1}>
        <SkillsGrid />
      </AnimateInView>
      <AnimateInView variant="fade-up" delay={0.05}>
        <FeaturedProjects locale={locale} />
      </AnimateInView>
      <CTABanner />
    </>
  );
}
