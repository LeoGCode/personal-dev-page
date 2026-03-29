"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project-card";
import { ArrowRight } from "lucide-react";

const projects = [
  {
    slug: "nexora-group",
    name: "Nexora Group",
    description:
      "Multi-landing SaaS platform for a software consultancy. Config-driven architecture serving 22+ service landing pages from a single Next.js app.",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Odoo", "PostgreSQL", "Docker"],
    status: "active" as const,
    url: "https://nexoragroup.com",
  },
  {
    slug: "personal-dev-page",
    name: "Personal Developer Page",
    description:
      "This portfolio site. Built with Next.js 16, bilingual (EN/ES), with Odoo CRM integration for collaboration requests.",
    stack: ["Next.js 16", "TypeScript", "Tailwind CSS", "MDX", "Odoo"],
    status: "in_progress" as const,
  },
  {
    slug: "openclaw-mobile",
    name: "OpenClaw Mobile",
    description:
      "Mobile legal research app with AI-powered case analysis and document management.",
    stack: ["React Native", "TypeScript", "AI/LLM"],
    status: "planned" as const,
  },
  {
    slug: "ai-credit-analyzer",
    name: "AI Credit Analyzer",
    description:
      "AI-powered credit analysis tool for financial institutions. Automated risk assessment and report generation.",
    stack: ["Python", "FastAPI", "AI/LLM", "PostgreSQL"],
    status: "in_progress" as const,
  },
];

export function FeaturedProjects() {
  const t = useTranslations("projects");

  return (
    <section id="projects" className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.slug}
              {...project}
              statusLabel={t(`status.${project.status}`)}
            />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link href="/projects">
              {t("view_all")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
