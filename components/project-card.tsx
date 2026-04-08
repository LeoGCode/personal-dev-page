"use client";

import { Link } from "@/lib/i18n/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useReducedMotion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { type ProjectStatus, statusStyles } from "@/lib/shared/status-styles";

export interface ProjectCardProps {
  slug: string;
  name: string;
  description: string;
  stack: string[];
  status: ProjectStatus;
  url?: string;
  statusLabel: string;
}

export function ProjectCard({
  slug,
  name,
  description,
  stack,
  status,
  url,
  statusLabel,
}: ProjectCardProps) {
  const posthog = usePostHog();
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { y: -6 }}
      transition={
        prefersReducedMotion
          ? undefined
          : { duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }
      }
      className="relative"
    >
      <Link
        href={`/projects/${slug}`}
        className="group block h-full"
        onClick={() =>
          posthog?.capture("project_card_clicked", {
            project_name: name,
            project_slug: slug,
          })
        }
      >
        <Card className="flex h-full flex-col transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="font-mono text-lg transition-colors duration-200 group-hover:text-primary">
                {name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`transition-colors duration-200 ${statusStyles[status]}`}
                >
                  {statusLabel}
                </Badge>
                {/* Spacer for external link icon rendered outside <a> */}
                {url && (
                  <span className="inline-flex h-4 w-4" aria-hidden="true" />
                )}
              </div>
            </div>
            <CardDescription className="mt-2 leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <div className="flex flex-wrap gap-1.5">
              {stack.map((tech) => (
                <motion.div
                  key={tech}
                  whileHover={
                    prefersReducedMotion ? undefined : { scale: 1.05, y: -1 }
                  }
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : {
                          type: "spring",
                          stiffness: 500,
                          damping: 20,
                        }
                  }
                >
                  <Badge variant="secondary" className="text-xs font-normal">
                    {tech}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>
      {/* External link rendered outside <Link> to avoid invalid <a> nesting */}
      {url && (
        <motion.a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={
            prefersReducedMotion ? undefined : { scale: 1.15, rotate: -12 }
          }
          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  type: "spring",
                  stiffness: 400,
                  damping: 17,
                }
          }
          onClick={(e) => {
            e.stopPropagation();
            posthog?.capture("outbound_link_clicked", {
              url,
              label: name,
              context: "project_card",
            });
          }}
          aria-label={`Open ${name} in a new tab`}
          className="absolute right-4 top-4 z-10 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </motion.a>
      )}
    </motion.div>
  );
}
