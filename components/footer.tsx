"use client";

import { useTranslations } from "next-intl";
import { Mail, FileText, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePostHog } from "posthog-js/react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const socialLinks = [
  {
    key: "github",
    href: "https://github.com/LeoGCode",
    icon: GithubIcon,
    ariaLabel: "GitHub profile",
  },
  {
    key: "linkedin",
    href: "https://linkedin.com/in/leogcode",
    icon: LinkedinIcon,
    ariaLabel: "LinkedIn profile",
  },
  {
    key: "email",
    href: "mailto:hello@leoneldev.com",
    icon: Mail,
    ariaLabel: "Send email",
  },
];

export function Footer() {
  const t = useTranslations("footer");
  const posthog = usePostHog();
  const prefersReducedMotion = useReducedMotion();

  return (
    <footer>
      {/* Gradient top border */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

      <motion.div
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        className="mx-auto max-w-5xl px-4 py-12"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Social links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <motion.a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
                aria-label={link.ariaLabel}
                whileHover={
                  prefersReducedMotion ? undefined : { scale: 1.1, y: -2 }
                }
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                transition={
                  prefersReducedMotion
                    ? undefined
                    : { type: "spring", stiffness: 400, damping: 17 }
                }
                onClick={() =>
                  posthog?.capture("outbound_link_clicked", {
                    url: link.href,
                    label: link.key,
                    context: "footer",
                  })
                }
              >
                <link.icon className="h-5 w-5" aria-hidden="true" />
              </motion.a>
            ))}
            {/* Resume link */}
            <a
              href="/resume.pdf"
              className="group inline-flex items-center gap-1 rounded-md p-2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
              aria-label={t("resume")}
              onClick={() =>
                posthog?.capture("resume_downloaded", {
                  context: "footer",
                })
              }
            >
              <FileText className="h-5 w-5" />
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Nexora link */}
          <p className="text-sm text-muted-foreground">
            {t("founder")}{" "}
            <a
              href="https://nexoragroup.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors duration-200"
              onClick={() =>
                posthog?.capture("outbound_link_clicked", {
                  url: "https://nexoragroup.com",
                  label: "nexora",
                  context: "footer",
                })
              }
            >
              <span translate="no">Nexora Group</span>
            </a>
          </p>

          {/* Built with */}
          <p className="text-xs text-muted-foreground">{t("built_with")}</p>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            {t("copyright", { year: String(new Date().getFullYear()) })}
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
