export type SkillLevel = "daily" | "proficient" | "exploring";

export interface Skill {
  name: string;
  level: SkillLevel;
}

export interface SkillCategory {
  category: string;
  items: Skill[];
}

export const skills: SkillCategory[] = [
  {
    category: "languages",
    items: [
      { name: "TypeScript", level: "daily" },
      { name: "Python", level: "daily" },
      { name: "Go", level: "proficient" },
      { name: "C#", level: "proficient" },
      { name: "Java", level: "proficient" },
      { name: "Rust", level: "exploring" },
      { name: "Elixir", level: "exploring" },
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
      { name: "Django", level: "daily" },
      { name: "FastAPI", level: "daily" },
      { name: "Flask", level: "proficient" },
      { name: "NestJS", level: "proficient" },
      { name: "Express", level: "proficient" },
      { name: "PostgreSQL", level: "daily" },
      { name: "Redis", level: "proficient" },
    ],
  },
  {
    category: "observability",
    items: [
      { name: "Grafana", level: "daily" },
      { name: "Prometheus", level: "proficient" },
      { name: "Loki", level: "proficient" },
      { name: "Tempo", level: "exploring" },
      { name: "Alertmanager", level: "proficient" },
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

export const levelColors: Record<SkillLevel, string> = {
  daily: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  proficient: "border-sky-500/50 bg-sky-500/10 text-sky-400",
  exploring: "border-amber-500/50 bg-amber-500/10 text-amber-400",
};
