"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
  useReducedMotion,
} from "motion/react";
import {
  Code,
  Layers,
  Activity,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { projects } from "@/content/projects";
import { skills } from "@/content/skills";

const FEATURED_SKILLS = skills
  .flatMap((cat) => cat.items)
  .filter((s) => s.level === "deep")
  .slice(0, 5);

const REMAINING_SKILL_COUNT =
  skills.flatMap((cat) => cat.items).length - FEATURED_SKILLS.length;

const EMPTY_LINE = { text: "", color: "text-gray-400" };

const RAW_CODE_SNIPPETS = [
  {
    label: "Frontend",
    lines: [
      { text: "export function", color: "text-purple-400" },
      { text: " Dashboard() {", color: "text-blue-300" },
      { text: "  const { data } = ", color: "text-gray-400" },
      { text: "useSWR", color: "text-yellow-300" },
      { text: "('/api/analytics');", color: "text-emerald-400" },
      { text: "", color: "text-gray-400" },
      { text: "  return (", color: "text-purple-400" },
      { text: "    <Card>", color: "text-blue-300" },
      { text: "      <MetricsGrid", color: "text-blue-300" },
      { text: "        data={data}", color: "text-emerald-400" },
      { text: "      />", color: "text-blue-300" },
      { text: "      <RevenueChart />", color: "text-orange-300" },
      { text: "    </Card>", color: "text-blue-300" },
      { text: "  );", color: "text-purple-400" },
      { text: "}", color: "text-blue-300" },
    ],
  },
  {
    label: "Backend API",
    lines: [
      { text: "from fastapi ", color: "text-purple-400" },
      { text: "import FastAPI", color: "text-blue-300" },
      { text: "", color: "text-gray-400" },
      { text: "app = FastAPI()", color: "text-yellow-300" },
      { text: "", color: "text-gray-400" },
      { text: "@app.post('/api/leads')", color: "text-emerald-400" },
      { text: "async def create_lead(", color: "text-purple-400" },
      { text: "    data: LeadCreate", color: "text-blue-300" },
      { text: "):", color: "text-gray-400" },
      { text: "    lead = await db.insert(", color: "text-gray-400" },
      { text: "        leads, data", color: "text-orange-300" },
      { text: "    )", color: "text-gray-400" },
      { text: "    await crm.sync(lead)", color: "text-emerald-400" },
      { text: "    return lead", color: "text-blue-300" },
    ],
  },
  {
    label: "Infrastructure",
    lines: [
      { text: "services:", color: "text-purple-400" },
      { text: "  app:", color: "text-blue-300" },
      { text: "    build: ./app", color: "text-emerald-400" },
      { text: "    depends_on:", color: "text-yellow-300" },
      { text: "      - odoo", color: "text-emerald-400" },
      { text: "  odoo:", color: "text-blue-300" },
      { text: "    image: odoo:18", color: "text-gray-400" },
      { text: "  traefik:", color: "text-blue-300" },
      { text: "    image: traefik:v3", color: "text-orange-300" },
      { text: "    ports:", color: "text-yellow-300" },
      { text: '      - "443:443"', color: "text-emerald-400" },
    ],
  },
  {
    label: "AI Integration",
    lines: [
      { text: "from langgraph ", color: "text-purple-400" },
      { text: "import StateGraph", color: "text-blue-300" },
      { text: "", color: "text-gray-400" },
      { text: "def qualify_lead():", color: "text-purple-400" },
      { text: "    workflow = StateGraph()", color: "text-gray-400" },
      { text: "    workflow.add_node(", color: "text-yellow-300" },
      { text: "        'analyze', scorer", color: "text-emerald-400" },
      { text: "    )", color: "text-gray-400" },
      { text: "    workflow.add_edge(", color: "text-yellow-300" },
      { text: "        'analyze', 'classify'", color: "text-emerald-400" },
      { text: "    )", color: "text-gray-400" },
      { text: "    return workflow.compile()", color: "text-orange-300" },
    ],
  },
];

/* Pad every snippet to the length of the longest one so the tile never shifts */
const MAX_LINES = Math.max(...RAW_CODE_SNIPPETS.map((s) => s.lines.length));
const CODE_SNIPPETS = RAW_CODE_SNIPPETS.map((s) => ({
  ...s,
  lines: [
    ...s.lines,
    ...Array.from({ length: MAX_LINES - s.lines.length }, () => EMPTY_LINE),
  ],
}));

function BentoTile({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      className={`rounded-2xl border border-border/60 bg-card p-6 shadow-sm dark:shadow-none transition-colors hover:border-primary/30 ${className}`}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? undefined
          : { duration: 0.5, delay, ease: "easeOut" }
      }
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -4, transition: { duration: 0.2 } }
      }
    >
      {children}
    </motion.div>
  );
}

function AnimatedCounter({
  target,
  duration = 2,
}: {
  target: number;
  duration?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(prefersReducedMotion ? target : 0);
  const [display, setDisplay] = useState(prefersReducedMotion ? target : 0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const controls = animate(motionValue, target, {
      duration,
      ease: "easeOut",
    });

    const unsubscribe = motionValue.on("change", (latest) => {
      setDisplay(Math.round(latest));
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [motionValue, target, duration, prefersReducedMotion]);

  return <>{display}</>;
}

export function Hero() {
  const t = useTranslations("hero");
  const tProjects = useTranslations("projects");
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const [snippetIndex, setSnippetIndex] = useState(0);

  const latestProject = projects[0];

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setSnippetIndex((prev) => (prev + 1) % CODE_SNIPPETS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const currentSnippet = CODE_SNIPPETS[snippetIndex];

  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] items-center px-4 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {/* Row 1 – 2 columns */}
        <div className="grid auto-rows-[minmax(160px,auto)] grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
          {/* Name tile */}
          <BentoTile className="flex flex-col justify-center" delay={0}>
            <p className="mb-3 font-mono text-sm text-primary">
              {t("greeting")}
            </p>
            <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
              {t("subtitle")}
            </p>
          </BentoTile>

          {/* Code snippet tile */}
          <BentoTile className="hidden md:flex flex-col" delay={0.1}>
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Code className="h-3.5 w-3.5" aria-hidden="true" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentSnippet.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentSnippet.label}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="flex-1 rounded-lg bg-gray-900 p-3">
              <AnimatePresence mode="wait">
                <motion.pre
                  key={snippetIndex}
                  className="font-mono text-[11px] leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentSnippet.lines.map((line, i) => (
                    <div key={i} className={line.color}>
                      {line.text || "\u00A0"}
                    </div>
                  ))}
                </motion.pre>
              </AnimatePresence>
            </div>
          </BentoTile>
        </div>

        {/* Row 2 – 3 columns */}
        <div className="grid auto-rows-[minmax(160px,auto)] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_2.5fr]">
          {/* Stats tile */}
          <BentoTile
            className="flex flex-col justify-between bg-primary/10 dark:bg-primary/5"
            delay={0.2}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("stats_label")}
              </span>
              <Layers
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="font-mono text-2xl font-bold">
                  <AnimatedCounter target={5} />+
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("projects_label")}
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold">
                  <AnimatedCounter target={7} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("languages_label")}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {t("full_stack")}
              </span>
              {FEATURED_SKILLS.map((skill) => (
                <span
                  key={skill.name}
                  className="inline-block rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  {skill.name}
                </span>
              ))}
              <span className="inline-block rounded-full border border-border/40 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground/60">
                {t("more_skills", { count: REMAINING_SKILL_COUNT })}
              </span>
            </div>
          </BentoTile>

          {/* Available tile */}
          <BentoTile
            className="flex flex-col gap-3 bg-accent/50 dark:bg-accent/30"
            delay={0.25}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                <span className="text-sm font-medium text-primary">
                  {t("available")}
                </span>
              </div>
              <Activity
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("available_description")}
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <Clock
                className="h-3.5 w-3.5 shrink-0 text-primary/70"
                aria-hidden="true"
              />
              <span className="text-xs text-primary/70">
                {t("response_time")}
              </span>
            </div>
            <Link
              href="/projects"
              className="group mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t("cta_secondary")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </BentoTile>

          {/* Latest project tile */}
          <BentoTile
            className="flex flex-col justify-between md:col-span-2 lg:col-span-1"
            delay={0.3}
          >
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("latest_project")}</span>
              </div>
              <h3 className="font-mono text-lg font-bold">
                {latestProject.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {latestProject.description[locale] ??
                  latestProject.description.en}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {latestProject.tech.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href={`/projects/${latestProject.slug}`}
              className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {tProjects("view_project")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </BentoTile>
        </div>
      </div>
    </section>
  );
}
