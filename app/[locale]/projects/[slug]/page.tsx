import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/lib/i18n/navigation";
import { getProjectBySlug, getAllProjectSlugs } from "@/content/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ProjectDetailLinks } from "@/components/project-detail-links";
import { statusStyles } from "@/lib/shared/status-styles";

export function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: project.title,
    description: project.description[locale] ?? project.description.en,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const project = getProjectBySlug(slug);
  if (!project) {
    notFound();
  }

  const t = await getTranslations("projects");
  const description = project.description[locale] ?? project.description.en;
  const longDescription =
    project.longDescription[locale] ?? project.longDescription.en;
  const highlights = project.highlights[locale] ?? project.highlights.en;

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/projects"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back_to_projects")}
        </Link>

        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
              {project.title}
            </h1>
            <Badge variant="outline" className={statusStyles[project.status]}>
              {t(`status.${project.status}`)}
            </Badge>
          </div>

          <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        </div>

        <div className="mt-10 space-y-8">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-base leading-relaxed text-foreground/90">
              {longDescription}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">
                {t("detail.tech_stack")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {highlights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-lg">
                  {t("highlights")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {highlights.map((highlight, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground/90"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(project.live || project.github) && (
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-lg">
                  {t("detail.links")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <ProjectDetailLinks
                  projectName={project.title}
                  liveUrl={project.live}
                  githubUrl={project.github}
                  liveSiteLabel={t("detail.live_site")}
                  githubLabel={t("detail.github")}
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="font-mono text-lg font-medium">
                {t("detail.interested")}
              </p>
              <Button asChild>
                <Link href="/collaborate">{t("detail.interested_cta")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
