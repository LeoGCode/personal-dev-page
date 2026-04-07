"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export function About() {
  const t = useTranslations("about");

  return (
    <section className="px-4 py-24">
      <div className="mx-auto flex max-w-5xl gap-8">
        {/* Animated gradient accent bar */}
        <motion.div
          className="hidden w-1 shrink-0 rounded-full bg-gradient-to-b from-primary via-primary/40 to-transparent sm:block"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ originY: 0 }}
        />

        {/* Content */}
        <div>
          <motion.h2
            className="font-mono text-2xl font-bold tracking-tight sm:text-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {t("title")}
          </motion.h2>

          <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0, ease: "easeOut" }}
            >
              {t("paragraph_1")}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              {t.rich("paragraph_2", {
                nexora: (chunks) => (
                  <a
                    href="https://nexoragroup.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4 transition-all hover:text-primary/80 hover:underline-offset-8"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              {t("paragraph_3")}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
