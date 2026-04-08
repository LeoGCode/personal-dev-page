"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  type TechStackProps,
  type SkillLevel,
  type SkillCategory,
  type Skill,
  levelColors,
  levelMeta,
  countByLevel,
  agentBridgeExamples,
} from "./shared";

/* ── Column configuration ── */
const levels: SkillLevel[] = ["deep", "augmented"];

const columnStyles: Record<
  SkillLevel,
  { headerBg: string; headerBorder: string; cellBg: string }
> = {
  deep: {
    headerBg: "bg-emerald-500/10",
    headerBorder: "border-b-2 border-emerald-500/50",
    cellBg: "bg-emerald-500/[0.03]",
  },
  augmented: {
    headerBg: "bg-sky-500/10",
    headerBorder: "border-b-2 border-sky-500/50",
    cellBg: "",
  },
};

/* ── Get skills in a category for a specific level ── */
function getCategorySkillsByLevel(
  category: SkillCategory,
  level: SkillLevel,
): Skill[] {
  return category.items.filter((s) => s.level === level);
}

/* ── Main component ── */
export default function TechMatrix({
  skills,
  getCategoryLabel,
  levelLabels,
}: TechStackProps) {
  const counts = countByLevel(skills);

  return (
    <section className="py-24">
      {/* ── Title ── */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <h2 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tech Stack
        </h2>
        <p className="mt-3 text-muted-foreground">
          A matrix of skills mapped by category and proficiency depth.
        </p>
      </div>

      {/* ── Matrix container ── */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-[180px_1fr_1fr]">
            {/* ── Header row ── */}
            {/* Empty corner cell */}
            <div className="p-4" />

            {/* Column headers */}
            {levels.map((level) => {
              const meta = levelMeta[level];
              const col = columnStyles[level];
              const count = counts[level];

              return (
                <div
                  key={level}
                  className={cn(
                    "p-4 font-mono text-sm font-semibold",
                    col.headerBg,
                    col.headerBorder,
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        meta.dot,
                        meta.glow,
                      )}
                    />
                    <span className={meta.text}>{levelLabels[level]}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {count} {count === 1 ? "skill" : "skills"}
                  </p>
                </div>
              );
            })}

            {/* ── Data rows (one per category) ── */}
            {skills.map((category, rowIndex) => (
              <motion.div
                key={category.category}
                className="col-span-3 grid grid-cols-subgrid"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.4,
                  delay: rowIndex * 0.06,
                  ease: "easeOut",
                }}
              >
                {/* Category label cell */}
                <div className="flex items-start gap-2 p-4">
                  <span className="mt-0.5 inline-block h-4 w-0.5 shrink-0 rounded-full bg-emerald-500/50" />
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {getCategoryLabel(category.category)}
                  </span>
                </div>

                {/* Level cells */}
                {levels.map((level) => {
                  const cellSkills = getCategorySkillsByLevel(category, level);
                  const col = columnStyles[level];

                  return (
                    <div
                      key={level}
                      className={cn(
                        "border-b border-border/20 p-4",
                        col.cellBg,
                      )}
                    >
                      {cellSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cellSkills.map((skill, skillIndex) => (
                            <motion.div
                              key={skill.name}
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true, amount: 0.3 }}
                              transition={{
                                duration: 0.25,
                                delay: rowIndex * 0.06 + skillIndex * 0.04,
                                ease: "easeOut",
                              }}
                            >
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[11px]",
                                  levelColors[skill.level],
                                )}
                              >
                                {skill.name}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          &mdash;
                        </span>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ))}

            {/* ── Agent Layer row ── */}
            <motion.div
              className="relative col-span-3 mt-2 overflow-hidden rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              {/* Shimmer overlay */}
              <motion.div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              <div className="relative flex flex-col items-center gap-4 text-center">
                <span className="font-mono text-2xl text-emerald-400">
                  &#8734;
                </span>
                <p className="font-mono text-sm font-bold text-emerald-400">
                  Agent Adaptability Layer
                </p>
                <p className="max-w-lg text-sm text-muted-foreground">
                  My job is to solve the problem with the best tool available —
                  not the closest one. AI agents make that possible by turning
                  any technology into a productive one.
                </p>

                {/* Example technology badges */}
                <div className="flex flex-wrap justify-center gap-2">
                  {agentBridgeExamples.map((tech, i) => (
                    <motion.div
                      key={tech}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        duration: 0.25,
                        delay: 0.3 + i * 0.04,
                        ease: "easeOut",
                      }}
                    >
                      <Badge
                        variant="outline"
                        className="border-dashed border-muted-foreground/30 bg-transparent text-xs text-muted-foreground"
                      >
                        {tech}
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground/50">
                  + anything else the project requires
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {levels.map((level) => {
            const meta = levelMeta[level];
            return (
              <div key={level} className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full",
                    meta.dot,
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {levelLabels[level]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
