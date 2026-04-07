"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import { ArrowRight, Code, Layers, Activity, ChevronDown } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";

const CODE_SNIPPETS = [
  {
    label: "React Component",
    lines: [
      { text: "export function", color: "text-purple-400" },
      { text: " Hero() {", color: "text-blue-300" },
      { text: "  const t = ", color: "text-gray-400" },
      { text: "useTranslations", color: "text-yellow-300" },
      { text: '("hero");', color: "text-emerald-400" },
      { text: "  return (", color: "text-gray-400" },
      { text: "    <section", color: "text-blue-300" },
      { text: '      className="flex"', color: "text-emerald-400" },
      { text: "    >", color: "text-blue-300" },
      { text: "      {t('title')}", color: "text-orange-300" },
      { text: "    </section>", color: "text-blue-300" },
      { text: "  );", color: "text-gray-400" },
      { text: "}", color: "text-blue-300" },
    ],
  },
  {
    label: "API Route",
    lines: [
      { text: "import { NextResponse }", color: "text-purple-400" },
      { text: '  from "next/server";', color: "text-emerald-400" },
      { text: "", color: "text-gray-400" },
      { text: "export async function", color: "text-purple-400" },
      { text: "  POST(req: Request) {", color: "text-blue-300" },
      { text: "  const body = await", color: "text-gray-400" },
      { text: "    req.json();", color: "text-yellow-300" },
      { text: "  const result = await", color: "text-gray-400" },
      { text: "    db.insert(leads)", color: "text-orange-300" },
      { text: "      .values(body);", color: "text-orange-300" },
      { text: "  return NextResponse", color: "text-gray-400" },
      { text: "    .json({ ok: true });", color: "text-emerald-400" },
      { text: "}", color: "text-blue-300" },
    ],
  },
  {
    label: "Docker Config",
    lines: [
      { text: "services:", color: "text-purple-400" },
      { text: "  app:", color: "text-blue-300" },
      { text: "    build: .", color: "text-gray-400" },
      { text: "    ports:", color: "text-yellow-300" },
      { text: '      - "3000:3000"', color: "text-emerald-400" },
      { text: "    environment:", color: "text-yellow-300" },
      { text: "      DATABASE_URL:", color: "text-orange-300" },
      { text: "        postgres://...", color: "text-emerald-400" },
      { text: "    depends_on:", color: "text-yellow-300" },
      { text: "      postgres:", color: "text-blue-300" },
      { text: "        condition:", color: "text-gray-400" },
      { text: "          service_healthy", color: "text-emerald-400" },
      { text: "    restart: always", color: "text-gray-400" },
    ],
  },
];

function BentoTile({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`rounded-2xl border border-border/60 bg-card p-6 shadow-sm dark:shadow-none transition-colors hover:border-primary/30 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedCounter({ target, duration = 2 }: { target: number; duration?: number }) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
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
  }, [motionValue, target, duration]);

  return <>{display}</>;
}

export function Hero() {
  const t = useTranslations("hero");
  const [snippetIndex, setSnippetIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSnippetIndex((prev) => (prev + 1) % CODE_SNIPPETS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentSnippet = CODE_SNIPPETS[snippetIndex];

  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] items-center px-4 py-12">
      <div className="mx-auto grid w-full max-w-6xl auto-rows-[minmax(160px,auto)] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Name tile */}
        <BentoTile className="flex flex-col justify-center lg:col-span-2" delay={0}>
          <p className="mb-3 font-mono text-sm text-primary">{t("greeting")}</p>
          <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
        </BentoTile>

        {/* Code snippet tile */}
        <BentoTile className="flex flex-col lg:row-span-2" delay={0.1}>
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Code className="h-3.5 w-3.5" />
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

        {/* Status tile */}
        <BentoTile className="flex flex-col justify-between bg-accent/50 dark:bg-accent/30" delay={0.15}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-sm font-medium text-emerald-500">Available</span>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Open to collaboration, consulting, and open-source work.
          </p>
        </BentoTile>

        {/* Stats tile */}
        <BentoTile className="flex flex-col justify-between bg-primary/10 dark:bg-primary/5" delay={0.2}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Stats
            </span>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <div className="font-mono text-2xl font-bold">
                <AnimatedCounter target={5} />+
              </div>
              <div className="text-xs text-muted-foreground">Projects</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold">
                <AnimatedCounter target={3} />
              </div>
              <div className="text-xs text-muted-foreground">Languages</div>
            </div>
          </div>
          <div className="mt-3">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Full Stack
            </span>
          </div>
        </BentoTile>

        {/* CTA tile */}
        <BentoTile className="flex flex-col justify-center gap-3" delay={0.25}>
          <Button asChild size="lg" className="group w-full">
            <Link href="/collaborate">
              {t("cta_primary")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <a href="#projects">
              {t("cta_secondary")}
              <ChevronDown className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </BentoTile>
      </div>
    </section>
  );
}
