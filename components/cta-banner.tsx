"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const gradientStyle = `
@property --cta-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@keyframes cta-rotate {
  to {
    --cta-angle: 360deg;
  }
}

.cta-gradient-border {
  --cta-angle: 0deg;
  animation: cta-rotate 4s linear infinite;
  background: linear-gradient(
    var(--cta-angle, 0deg),
    oklch(0.6 0.18 155),
    oklch(0.6 0.18 155 / 0.2),
    oklch(0.6 0.18 155 / 0.6),
    oklch(0.6 0.18 155)
  );
}
`;

export function CTABanner() {
  const t = useTranslations("cta");

  return (
    <section className="px-4 py-24">
      <style dangerouslySetInnerHTML={{ __html: gradientStyle }} />
      <motion.div
        className="mx-auto max-w-3xl"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="relative overflow-hidden rounded-2xl p-[2px]">
          {/* Animated rotating gradient border */}
          <div className="cta-gradient-border absolute inset-0" />

          {/* Inner content card */}
          <div className="relative bg-card rounded-[calc(1rem-2px)] px-6 py-16 sm:px-12 text-center">
            <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
              {t("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              {t("subtitle")}
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="group">
                <Link href="/collaborate">
                  {t("button")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
