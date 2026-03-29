import { setRequestLocale } from "next-intl/server";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="font-mono text-4xl font-bold">Blog</h1>
      <p className="mt-4 text-muted-foreground">Coming soon.</p>
    </div>
  );
}
