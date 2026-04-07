"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { skills, levelColors } from "@/content/skills";

export function SkillsGrid() {
  const t = useTranslations("skills");

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((group, i) => (
            <motion.div
              key={group.category}
              className="group relative rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_24px_-6px_theme(colors.emerald.500/15%)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <h3 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400/80">
                {t(`categories.${group.category}`)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((skill) => (
                  <motion.div
                    key={skill.name}
                    whileHover={{ scale: 1.08 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 17,
                    }}
                  >
                    <Badge
                      variant="outline"
                      className={`${levelColors[skill.level]} rounded-lg px-3 py-1`}
                    >
                      {skill.name}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500/40%)]" />
            {t("levels.daily")}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-sky-500 shadow-[0_0_6px_theme(colors.sky.500/40%)]" />
            {t("levels.proficient")}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_6px_theme(colors.amber.500/40%)]" />
            {t("levels.exploring")}
          </span>
        </div>
      </div>
    </section>
  );
}
