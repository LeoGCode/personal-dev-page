"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, useReducedMotion } from "motion/react";

const navLinks = [
  { href: "/", key: "home" },
  { href: "/projects", key: "projects" },
  { href: "/blog", key: "blog" },
] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const otherLocale = locale === "en" ? "es" : "en";

  function switchLocale() {
    router.replace(pathname, { locale: otherLocale });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md transition-[background-color,border-color] duration-300">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-mono text-lg font-bold tracking-tight transition-colors duration-200"
        >
          <motion.span
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            className="inline-block"
          >
            Leonel
          </motion.span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`relative rounded-md px-3 py-2 text-sm transition-colors hover:text-foreground ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-primary/40 after:transition-all after:duration-300 hover:after:w-full"
                }`}
              >
                {t(link.key)}
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
          <Button
            asChild
            size="sm"
            className="group ml-2 transition-colors duration-200 hover:shadow-md hover:shadow-primary/10"
          >
            <Link href="/collaborate">{t("collaborate")}</Link>
          </Button>
          <motion.div whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={switchLocale}
              aria-label={locale === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
              className="ml-1 font-mono text-xs transition-colors duration-200"
            >
              {otherLocale.toUpperCase()}
            </Button>
          </motion.div>
          <ThemeToggle />
        </div>

        {/* Mobile navigation */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <motion.div whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={switchLocale}
              aria-label={locale === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
              className="font-mono text-xs transition-colors duration-200"
            >
              {otherLocale.toUpperCase()}
            </Button>
          </motion.div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <motion.div whileTap={prefersReducedMotion ? undefined : { rotate: 90 }}>
                  <Menu className="h-5 w-5" />
                </motion.div>
                <span className="sr-only">{t("menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="font-mono">Leonel</SheetTitle>
              <div className="mt-6 flex flex-col gap-2">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.key}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                        pathname === link.href
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {t(link.key)}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.05 }}
                >
                  <Button asChild className="mt-2">
                    <Link href="/collaborate" onClick={() => setOpen(false)}>
                      {t("collaborate")}
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
