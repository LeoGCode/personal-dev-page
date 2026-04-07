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
import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import {
  type ProjectStatus,
  statusStyles,
} from "@/lib/shared/status-styles";

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

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
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
        <Card className="flex h-full flex-col transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
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
                {url && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15, rotate: -12 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 17,
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      posthog?.capture("outbound_link_clicked", {
                        url,
                        label: name,
                        context: "project_card",
                      });
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    aria-label={`Open ${name} in a new tab`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </motion.button>
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
                  whileHover={{ scale: 1.05, y: -1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 20,
                  }}
                >
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {tech}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
