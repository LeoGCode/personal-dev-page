export type SkillLevel = "deep" | "augmented";

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
      { name: "Python", level: "deep" },
      { name: "TypeScript", level: "deep" },
      { name: "Go", level: "deep" },
      { name: "C#", level: "deep" },
      { name: "Java", level: "deep" },
      { name: "Kotlin", level: "deep" },
      { name: "C/C++", level: "augmented" },
      { name: "Swift", level: "augmented" },
      { name: "PHP", level: "augmented" },
      { name: "Ruby", level: "augmented" },
      { name: "Rust", level: "augmented" },
    ],
  },
  {
    category: "frontend",
    items: [
      { name: "React", level: "deep" },
      { name: "Next.js", level: "deep" },
      { name: "Tailwind CSS", level: "deep" },
      { name: "Motion", level: "augmented" },
      { name: "Vue", level: "augmented" },
      { name: "Svelte", level: "augmented" },
    ],
  },
  {
    category: "backend",
    items: [
      { name: "Django", level: "deep" },
      { name: "FastAPI", level: "deep" },
      { name: "Express", level: "deep" },
      { name: "NestJS", level: "deep" },
      { name: "Spring Boot", level: "deep" },
      { name: "Node.js", level: "deep" },
      { name: "Laravel", level: "augmented" },
      { name: "Ruby on Rails", level: "augmented" },
    ],
  },
  {
    category: "infrastructure",
    items: [
      { name: "Docker", level: "deep" },
      { name: "Linux", level: "deep" },
      { name: "GitHub Actions", level: "deep" },
      { name: "Kubernetes", level: "augmented" },
      { name: "Terraform", level: "augmented" },
    ],
  },
  {
    category: "data_dbs",
    items: [
      { name: "PostgreSQL", level: "deep" },
      { name: "PGVector", level: "deep" },
      { name: "MongoDB", level: "deep" },
      { name: "Redis", level: "deep" },
      { name: "Pinecone", level: "augmented" },
      { name: "Elasticsearch", level: "augmented" },
    ],
  },
  {
    category: "ai_llm",
    items: [
      { name: "LangChain", level: "deep" },
      { name: "LangGraph", level: "deep" },
      { name: "Prompt Engineering", level: "deep" },
      { name: "MCP", level: "deep" },
      { name: "Structured Outputs", level: "deep" },
      { name: "RAG", level: "augmented" },
      { name: "Fine-tuning", level: "augmented" },
    ],
  },
  {
    category: "observability",
    items: [
      { name: "Grafana", level: "deep" },
      { name: "LangSmith", level: "deep" },
      { name: "Sentry", level: "deep" },
      { name: "Prometheus", level: "augmented" },
      { name: "ELK Stack", level: "augmented" },
    ],
  },
  {
    category: "tools",
    items: [
      { name: "Git", level: "deep" },
      { name: "Cloudflare", level: "deep" },
      { name: "AWS", level: "deep" },
      { name: "PostHog", level: "augmented" },
      { name: "GCP", level: "augmented" },
      { name: "Azure", level: "augmented" },
    ],
  },
];

export const levelColors: Record<SkillLevel, string> = {
  deep: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  augmented: "border-sky-500/50 bg-sky-500/10 text-sky-400",
};
