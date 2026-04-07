"use client";

import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { PostHog } from "posthog-js";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) {
        url += "?" + search;
      }
      ph.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  const [client, setClient] = useState<PostHog | null>(null);

  useEffect(() => {
    if (key && host) {
      import("posthog-js").then((mod) => {
        const posthog = mod.default;
        posthog.init(key, {
          api_host: host,
          person_profiles: "identified_only",
          capture_pageview: false,
          capture_pageleave: true,
        });
        setClient(posthog);
      });
    }
  }, [key, host]);

  if (!key || !client) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={client}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
