"use client";

import { useTranslations } from "next-intl";

export function About() {
  const t = useTranslations("about");

  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h2>
        <div className="mt-8 space-y-5 text-muted-foreground leading-relaxed">
          <p>{t("paragraph_1")}</p>
          <p>
            {t.rich("paragraph_2", {
              nexora: (chunks) => (
                <a
                  href="https://nexoragroup.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <p>{t("paragraph_3")}</p>
        </div>
      </div>
    </section>
  );
}
