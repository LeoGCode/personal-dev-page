"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, Code } from "lucide-react";

interface ProjectDetailLinksProps {
  liveUrl?: string;
  githubUrl?: string;
  liveSiteLabel: string;
  githubLabel: string;
}

/** Outbound clicks are tracked globally (outbound_clicked). */
export function ProjectDetailLinks({
  liveUrl,
  githubUrl,
  liveSiteLabel,
  githubLabel,
}: ProjectDetailLinksProps) {
  return (
    <>
      {liveUrl && (
        <Button asChild variant="outline" size="sm">
          <a href={liveUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            {liveSiteLabel}
          </a>
        </Button>
      )}
      {githubUrl && (
        <Button asChild variant="outline" size="sm">
          <a href={githubUrl} target="_blank" rel="noopener noreferrer">
            <Code className="mr-2 h-4 w-4" />
            {githubLabel}
          </a>
        </Button>
      )}
    </>
  );
}
