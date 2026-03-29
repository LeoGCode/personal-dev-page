"use client";

import { Link } from "@/lib/i18n/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";

type ProjectStatus = "active" | "in_progress" | "planned";

export interface ProjectCardProps {
  slug: string;
  name: string;
  description: string;
  stack: string[];
  status: ProjectStatus;
  url?: string;
  statusLabel: string;
}

const statusStyles: Record<ProjectStatus, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  in_progress: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  planned: "border-blue-500/30 bg-blue-500/10 text-blue-500",
};

export function ProjectCard({
  slug,
  name,
  description,
  stack,
  status,
  url,
  statusLabel,
}: ProjectCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Link href={`/projects/${slug}`} className="block h-full">
        <Card className="flex h-full flex-col transition-colors hover:border-primary/30">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="font-mono text-lg">{name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={statusStyles[status]}
                >
                  {statusLabel}
                </Badge>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
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
                <Badge key={tech} variant="secondary" className="text-xs font-normal">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
