"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { loadAdTags, revokeAdTags, trackAdPageView } from "@/lib/analytics/ads";
import { useConsent, type ConsentChoice } from "@/lib/analytics/consent";
import {
  installInteractionTracking,
  observeSections,
} from "@/lib/analytics/dom";
import {
  disableSentryReplay,
  enableSentryReplay,
} from "@/lib/analytics/sentry-replay";
import {
  applyAnalyticsConsent,
  clearTrackingStorage,
  getAttribution,
  trackPageview,
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
      trackPageview();
      if (!firstView.current) trackAdPageView();
      firstView.current = false;
      stopSections = observeSections();
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
    return installInteractionTracking();
  }, []);

  const choice = consent?.choice ?? null;
  const origin = consent?.origin ?? null;
  useEffect(() => {
    if (!choice) return;
    const previous = previousChoice.current;
    previousChoice.current = choice;
    applyAnalyticsConsent(choice);
    if (choice === "granted") {
      loadAdTags();
      enableSentryReplay();
      return;
    }
    revokeAdTags();
    disableSentryReplay();
    if (previous === "granted") {
      // Withdrawn here or in another tab: capture, replay and the ad tags
      // stopped above; now the stored ids go. The tab where it was clicked
      // also reloads, so the ad scripts are gone.
      clearTrackingStorage();
      if (origin === "this-tab") window.location.reload();
    }
  }, [choice, origin]);

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
