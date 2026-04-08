import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FolderKanban,
  BookOpen,
  MessageSquare,
} from "lucide-react";

const quickLinks = [
  {
    href: "/projects",
    labelKey: "link_projects",
    descKey: "link_projects_desc",
    icon: FolderKanban,
  },
  {
    href: "/blog",
    labelKey: "link_blog",
    descKey: "link_blog_desc",
    icon: BookOpen,
  },
  {
    href: "/collaborate",
    labelKey: "link_collaborate",
    descKey: "link_collaborate_desc",
    icon: MessageSquare,
  },
] as const;

export default async function NotFoundPage() {
  const t = await getTranslations("not_found");

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-7xl font-bold tracking-tighter text-primary sm:text-8xl">
          404
        </p>
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

        <div className="mt-12">
          <p className="text-sm text-muted-foreground">{t("suggestions")}</p>
          <div className="mt-4 grid gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-4 rounded-lg border border-border/60 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <link.icon className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t(link.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(link.descKey)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
