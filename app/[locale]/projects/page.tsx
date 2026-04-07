import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { projects } from "@/content/projects";
import { ProjectCard } from "@/components/project-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects" });

  return {
    title: t("all_title"),
    description: t("all_subtitle"),
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("projects");

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            {t("all_title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("all_subtitle")}</p>
        </div>

        {projects.length === 0 ? (
          <p className="text-center text-muted-foreground">
            {t("no_projects")}
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.slug}
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
