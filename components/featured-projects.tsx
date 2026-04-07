import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project-card";
import { ArrowRight } from "lucide-react";
import { projects } from "@/content/projects";
import { StaggeredReveal } from "@/components/staggered-reveal";

const FEATURED_COUNT = 4;

export async function FeaturedProjects({ locale }: { locale: string }) {
  const t = await getTranslations("projects");
  const featured = projects.slice(0, FEATURED_COUNT);

  return (
    <section id="projects" className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {featured.map((project, i) => (
            <StaggeredReveal key={project.slug} index={i}>
              <ProjectCard
                slug={project.slug}
                name={project.title}
                description={
                  project.description[locale] ?? project.description.en
                }
                stack={project.tech}
                status={project.status}
                url={project.live}
                statusLabel={t(`status.${project.status}`)}
              />
            </StaggeredReveal>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="group">
            <Link href="/projects">
              {t("view_all")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
