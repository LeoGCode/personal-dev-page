import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { SkillsGrid } from "@/components/skills-grid";
import { FeaturedProjects } from "@/components/featured-projects";
import { CTABanner } from "@/components/cta-banner";

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
      <About />
      <SkillsGrid />
      <FeaturedProjects />
      <CTABanner />
    </>
  );
}
