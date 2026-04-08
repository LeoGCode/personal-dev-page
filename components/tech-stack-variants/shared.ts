import {
  skills as allSkills,
  levelColors,
  type SkillCategory,
  type SkillLevel,
  type Skill,
} from "@/content/skills";

export { allSkills, levelColors };
export type { SkillCategory, SkillLevel, Skill };

/* ── Common props for every variant ── */
export interface TechStackProps {
  skills: SkillCategory[];
  getCategoryLabel: (category: string) => string;
  levelLabels: { deep: string; augmented: string };
  title?: string;
  description?: string;
  agentLayerTitle?: string;
  agentLayerDescription?: string;
  agentLayerMore?: string;
  skillSingular?: string;
  skillPlural?: string;
}

/* ── Defaults for Storybook & standalone use ── */
export const defaultCategoryLabels: Record<string, string> = {
  ai_llm: "AI & Agents",
  languages: "Languages",
  infrastructure: "Infrastructure",
  observability: "Observability",
  frontend: "Frontend",
  backend: "Backend",
  data_dbs: "Vector & Data",
  tools: "Tools & Platforms",
};

export const defaultLevelLabels = {
  deep: "Deep Expertise",
  augmented: "AI-Augmented",
};

export const defaultGetCategoryLabel = (category: string): string =>
  defaultCategoryLabels[category] ?? category;

/* ── Helpers ── */
export function getSkillsByLevel(
  categories: SkillCategory[],
  level: SkillLevel,
): Skill[] {
  return categories.flatMap((c) => c.items.filter((s) => s.level === level));
}

export function countByLevel(categories: SkillCategory[]) {
  return {
    deep: getSkillsByLevel(categories, "deep").length,
    augmented: getSkillsByLevel(categories, "augmented").length,
  };
}

/* ── Agent bridgeable examples ──
   Technologies NOT in the core stack but reachable on demand
   through AI agents. Shown in the Agent Adaptability Layer. */
export const agentBridgeExamples: string[] = [
  "Kafka",
  "Supabase",
  "Datadog",
  "Nginx",
  "RabbitMQ",
  "Ansible",
];

/* ── Level meta (color, glow, ring classes) ── */
export const levelMeta: Record<
  SkillLevel,
  {
    color: string;
    glow: string;
    dot: string;
    ring: string;
    text: string;
    bg: string;
  }
> = {
  deep: {
    color: "emerald",
    glow: "shadow-[0_0_8px_theme(colors.emerald.500/40%)]",
    dot: "bg-emerald-500",
    ring: "border-emerald-500/30",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  augmented: {
    color: "sky",
    glow: "shadow-[0_0_8px_theme(colors.sky.500/40%)]",
    dot: "bg-sky-500",
    ring: "border-sky-500/30",
    text: "text-sky-400",
    bg: "bg-sky-500/10",
  },
};
