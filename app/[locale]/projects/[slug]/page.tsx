import { setRequestLocale } from "next-intl/server";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="font-mono text-4xl font-bold">{slug}</h1>
      <p className="mt-4 text-muted-foreground">Project detail coming soon.</p>
    </div>
  );
}
