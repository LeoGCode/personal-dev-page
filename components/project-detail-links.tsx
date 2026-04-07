"use client";

import { usePostHog } from "posthog-js/react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Code } from "lucide-react";

interface ProjectDetailLinksProps {
  projectName: string;
  liveUrl?: string;
  githubUrl?: string;
  liveSiteLabel: string;
  githubLabel: string;
}

export function ProjectDetailLinks({
  projectName,
  liveUrl,
  githubUrl,
  liveSiteLabel,
  githubLabel,
}: ProjectDetailLinksProps) {
  const posthog = usePostHog();

  return (
    <>
      {liveUrl && (
        <Button asChild variant="outline" size="sm">
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              posthog?.capture("outbound_link_clicked", {
                url: liveUrl,
                label: projectName,
                context: "project_detail_live",
              })
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {liveSiteLabel}
          </a>
        </Button>
      )}
      {githubUrl && (
        <Button asChild variant="outline" size="sm">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              posthog?.capture("outbound_link_clicked", {
                url: githubUrl,
                label: projectName,
                context: "project_detail_github",
              })
            }
          >
            <Code className="mr-2 h-4 w-4" />
            {githubLabel}
          </a>
        </Button>
      )}
    </>
  );
}
