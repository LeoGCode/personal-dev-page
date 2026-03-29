"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <motion.div
        className="mx-auto max-w-3xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <p className="mb-4 font-mono text-sm text-primary">
          {t("greeting")}
        </p>
        <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          {t("subtitle")}
        </p>

        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <Button asChild size="lg">
            <Link href="/collaborate">
              {t("cta_primary")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#projects">
              {t("cta_secondary")}
              <ChevronDown className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
