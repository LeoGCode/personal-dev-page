"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTABanner() {
  const t = useTranslations("cta");

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-accent/50 px-6 py-16 text-center sm:px-12">
        <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/collaborate">
              {t("button")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
