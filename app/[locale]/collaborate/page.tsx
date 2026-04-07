import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { CollaborateForm } from "@/components/collaborate-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collaborate" });

  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function CollaboratePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("collaborate");

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-xl">
        <div className="mb-10 text-center">
          <h1 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <CollaborateForm />
      </div>
    </section>
  );
}
