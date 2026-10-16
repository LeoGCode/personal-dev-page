"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { loadAdTags, trackAdPageView } from "@/lib/analytics/ads";
import { useConsent, type ConsentChoice } from "@/lib/analytics/consent";
import {
  installInteractionTracking,
  observeSections,
} from "@/lib/analytics/dom";
import { enableSentryReplay } from "@/lib/analytics/sentry-replay";
import {
  applyAnalyticsConsent,
  clearTrackingStorage,
  getAttribution,
  registerPageContext,
  startPostHog,
  track,
} from "@/lib/analytics/track";

function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstView = useRef(true);

  useEffect(() => {
    let stopSections: (() => void) | undefined;
    // Deferred one tick so the page's own effects have run and its sections
    // are in the DOM before the $pageview goes out.
    const timer = window.setTimeout(() => {
      registerPageContext();
      track("$pageview", { $current_url: window.location.href });
      if (!firstView.current) trackAdPageView();
      firstView.current = false;
      stopSections = observeSections({ fallback: false });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      stopSections?.();
    };
  }, [pathname, searchParams]);

  return null;
}

/**
 * PostHog (consent-aware), Meta pixel + Google Ads tag and Sentry replay after
 * consent, document-level interaction tracking, the Calendly booking popup
 * (the cookie banner lives in the locale layout, where translations are). See
 * docs/analytics.md.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const consent = useConsent();
  const previousChoice = useRef<ConsentChoice | null>(null);

  useEffect(() => {
    getAttribution();
    startPostHog();
    return installInteractionTracking();
  }, []);

  const choice = consent?.choice ?? null;
  useEffect(() => {
    if (!choice) return;
    const previous = previousChoice.current;
    previousChoice.current = choice;
    if (previous === "granted" && choice === "denied") {
      // Withdrawn: drop the stored ids and reload so the ad scripts are gone.
      applyAnalyticsConsent("denied");
      clearTrackingStorage();
      window.location.reload();
      return;
    }
    applyAnalyticsConsent(choice);
    if (choice === "granted") {
      loadAdTags();
      enableSentryReplay();
    }
  }, [choice]);

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
