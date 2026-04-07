import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NotFoundPage() {
  const t = await getTranslations("not_found");

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="font-mono text-6xl font-bold text-primary">404</p>
        <h1 className="mt-4 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("message")}</p>
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back_home")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
