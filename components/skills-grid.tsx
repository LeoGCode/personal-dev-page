"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { useState } from "react";

type SkillLevel = "daily" | "proficient" | "exploring";

interface Skill {
  name: string;
  level: SkillLevel;
}

interface SkillCategory {
  category: string;
  items: Skill[];
}

const skills: SkillCategory[] = [
  {
    category: "languages",
    items: [
      { name: "TypeScript", level: "daily" },
      { name: "Python", level: "proficient" },
      { name: "Go", level: "exploring" },
    ],
  },
  {
    category: "frontend",
    items: [
      { name: "React", level: "daily" },
      { name: "Next.js", level: "daily" },
      { name: "Tailwind CSS", level: "daily" },
      { name: "Motion", level: "proficient" },
    ],
  },
  {
    category: "backend",
    items: [
      { name: "Node.js", level: "daily" },
      { name: "PostgreSQL", level: "daily" },
      { name: "Redis", level: "proficient" },
      { name: "Drizzle ORM", level: "proficient" },
    ],
  },
  {
    category: "infrastructure",
    items: [
      { name: "Docker", level: "daily" },
      { name: "Linux", level: "daily" },
      { name: "Traefik", level: "proficient" },
      { name: "GitHub Actions", level: "proficient" },
    ],
  },
  {
    category: "tools",
    items: [
      { name: "Git", level: "daily" },
      { name: "Odoo", level: "proficient" },
      { name: "PostHog", level: "proficient" },
      { name: "Cloudflare", level: "proficient" },
    ],
  },
];

const levelColors: Record<SkillLevel, string> = {
  daily: "border-primary/50 bg-primary/10 text-primary",
  proficient: "border-border bg-secondary text-secondary-foreground",
  exploring: "border-border bg-muted text-muted-foreground",
};

function SkillTag({ skill, levelLabel }: { skill: Skill; levelLabel: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className={`relative cursor-default rounded-md border px-3 py-1.5 text-sm transition-colors ${levelColors[skill.level]}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.15 }}
    >
      {hovered ? (
        <span className="font-mono text-xs">{levelLabel}</span>
      ) : (
        skill.name
      )}
    </motion.div>
  );
}

export function SkillsGrid() {
  const t = useTranslations("skills");

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((group) => (
            <div key={group.category}>
              <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t(`categories.${group.category}`)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((skill) => (
                  <SkillTag
                    key={skill.name}
                    skill={skill}
                    levelLabel={t(`levels.${skill.level}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
            {t("levels.daily")}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
            {t("levels.proficient")}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            {t("levels.exploring")}
          </span>
        </div>
      </div>
    </section>
  );
}
