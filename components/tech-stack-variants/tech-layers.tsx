"use client";

import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  type TechStackProps,
  type SkillLevel,
  type SkillCategory,
  allSkills,
  levelColors,
  levelMeta,
  countByLevel,
  agentBridgeExamples,
} from "./shared";

/* ── Tier configuration ── */
const levels: SkillLevel[] = ["deep", "augmented"];

const tierStyles: Record<SkillLevel, { wrapper: string; minH: string }> = {
  deep: {
    wrapper: "rounded-xl border border-border/40 bg-card/90 p-6",
    minH: "min-h-[140px]",
  },
  augmented: {
    wrapper: "rounded-xl border border-border/40 bg-card/70 p-5",
    minH: "",
  },
};

/* ── Get skills in a category for a specific level ── */
function getCategorySkillsByLevel(category: SkillCategory, level: SkillLevel) {
  return category.items.filter((s) => s.level === level);
}

/* ── Main component ── */
export default function TechLayers({
  skills,
  getCategoryLabel,
  levelLabels,
  title = "Tech Stack",
  description = "Layered tiers of proficiency — from deep expertise to AI-augmented reach.",
  agentLayerTitle = "Agent Adaptability Layer",
  agentLayerDescription = "My job is to solve the problem with the best tool available — not the closest one. AI agents make that possible by turning any technology into a productive one.",
  agentLayerMore = "+ anything else the project requires",
  skillSingular = "skill",
  skillPlural = "skills",
}: TechStackProps) {
  const prefersReducedMotion = useReducedMotion();
  const counts = countByLevel(skills);

  return (
    <section className="py-24">
      {/* ── Title ── */}
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <h2 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </div>

      {/* ── Outer dashed border — wraps tiers + agent layer ── */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="overflow-hidden rounded-2xl border border-dashed border-emerald-500/30">
          {/* ── Tier stack ── */}
          <div className="flex flex-col gap-3 p-4 sm:p-6">
            {levels.map((level, tierIndex) => {
              const meta = levelMeta[level];
              const tier = tierStyles[level];
              const count = counts[level];

              /* Categories that have at least one skill at this level */
              const relevantCategories = skills.filter(
                (cat) => getCategorySkillsByLevel(cat, level).length > 0,
              );

              return (
                <motion.div
                  key={level}
                  className={cn(tier.wrapper, tier.minH)}
                  initial={
                    prefersReducedMotion ? undefined : { opacity: 0, y: 20 }
                  }
                  whileInView={
                    prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
                  }
                  viewport={{ once: true, amount: 0.3 }}
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : {
                          duration: 0.5,
                          delay: tierIndex * 0.15,
                          ease: "easeOut",
                        }
                  }
                >
                  {/* Level header */}
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-block h-3 w-3 rounded-full",
                        meta.dot,
                        meta.glow,
                      )}
                    />
                    <span
                      className={cn("font-mono text-sm font-bold", meta.text)}
                    >
                      {levelLabels[level]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {count} {count === 1 ? skillSingular : skillPlural}
                    </span>
                  </div>

                  {/* Category clusters */}
                  <div className="flex flex-wrap gap-6">
                    {relevantCategories.map((category) => {
                      const catSkills = getCategorySkillsByLevel(
                        category,
                        level,
                      );
                      return (
                        <div
                          key={category.category}
                          className="flex flex-col gap-2"
                        >
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {getCategoryLabel(category.category)}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {catSkills.map((skill, skillIndex) => (
                              <motion.div
                                key={skill.name}
                                initial={
                                  prefersReducedMotion
                                    ? undefined
                                    : { opacity: 0, scale: 0.8 }
                                }
                                whileInView={
                                  prefersReducedMotion
                                    ? undefined
                                    : { opacity: 1, scale: 1 }
                                }
                                viewport={{ once: true, amount: 0.3 }}
                                transition={
                                  prefersReducedMotion
                                    ? undefined
                                    : {
                                        duration: 0.25,
                                        delay:
                                          tierIndex * 0.15 + skillIndex * 0.03,
                                        ease: "easeOut",
                                      }
                                }
                              >
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    levelColors[skill.level],
                                  )}
                                >
                                  {skill.name}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Agent Adaptability Layer ──
               Background fills edge-to-edge within the dashed border */}
          <motion.div
            className="relative overflow-hidden bg-emerald-500/5 px-6 py-8"
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
            whileInView={
              prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
            }
            viewport={{ once: true, amount: 0.3 }}
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 0.5, delay: 0.2, ease: "easeOut" }
            }
          >
            {/* Shimmer overlay */}
            {!prefersReducedMotion && (
              <motion.div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            )}

            <div className="relative flex flex-col items-center gap-4 text-center">
              <span className="font-mono text-2xl text-emerald-400">
                &#8734;
              </span>
              <p className="font-mono text-sm font-bold text-emerald-400">
                {agentLayerTitle}
              </p>
              <p className="max-w-lg text-sm text-muted-foreground">
                {agentLayerDescription}
              </p>

              {/* Example technology badges */}
              <div className="flex flex-wrap justify-center gap-2">
                {agentBridgeExamples.map((tech, i) => (
                  <motion.div
                    key={tech}
                    initial={
                      prefersReducedMotion
                        ? undefined
                        : { opacity: 0, scale: 0.8 }
                    }
                    whileInView={
                      prefersReducedMotion
                        ? undefined
                        : { opacity: 1, scale: 1 }
                    }
                    viewport={{ once: true, amount: 0.3 }}
                    transition={
                      prefersReducedMotion
                        ? undefined
                        : {
                            duration: 0.25,
                            delay: 0.3 + i * 0.04,
                            ease: "easeOut",
                          }
                    }
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
                {agentLayerMore}
              </p>
            </div>
          </motion.div>
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

/* ── i18n wrapper for page usage ── */
export function TechLayersSection() {
  const t = useTranslations("skills");

  return (
    <TechLayers
      skills={allSkills}
      getCategoryLabel={(cat) => t(`categories.${cat}`)}
      levelLabels={{
        deep: t("levels.deep"),
        augmented: t("levels.augmented"),
      }}
      title={t("title")}
      description={t("layers_description")}
      agentLayerTitle={t("agent_layer_title")}
      agentLayerDescription={t("agent_layer_description")}
      agentLayerMore={t("agent_layer_more")}
      skillSingular={t("skill_singular")}
      skillPlural={t("skill_plural")}
    />
  );
}
