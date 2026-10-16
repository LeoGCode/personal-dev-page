import { useSyncExternalStore } from "react";

/**
 * Cookie consent, kept in localStorage (the choice itself is strictly necessary storage).
 * - pending / denied: PostHog runs in memory only (no cookies, no storage, no replay); no ad tags.
 * - granted: PostHog persistence + session replay, Meta pixel and Google Ads tag.
 * Bump the key version to ask everyone again (e.g. after adding a vendor).
 */
export type ConsentChoice = "granted" | "denied" | "pending";

export const CONSENT_STORAGE_KEY = "leogcode-consent-v1";

export interface ConsentSnapshot {
  choice: ConsentChoice;
  /** Whether the banner is showing: no choice yet, or reopened from the privacy page. */
  open: boolean;
}

let snapshot: ConsentSnapshot | null = null;
const listeners = new Set<() => void>();

function readStoredChoice(): ConsentChoice {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : "pending";
  } catch {
    return "pending";
  }
}

function emit(next: ConsentSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function getConsentSnapshot(): ConsentSnapshot {
  if (!snapshot) {
    const choice = readStoredChoice();
    snapshot = { choice, open: choice === "pending" };
  }
  return snapshot;
}

export function getConsent(): ConsentChoice {
  if (typeof window === "undefined") return "pending";
  return getConsentSnapshot().choice;
}

export function setConsent(choice: "granted" | "denied") {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Private mode or blocked storage: the choice still applies to this page view.
  }
  emit({ choice, open: false });
}

/** Shows the banner again so the visitor can change their choice. */
export function reopenConsent() {
  emit({ ...getConsentSnapshot(), open: true });
}

export function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** `null` on the server and during hydration, so the banner never causes a mismatch. */
export function useConsent(): ConsentSnapshot | null {
  return useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => null);
}

/** Test helper: forget the cached snapshot so the next read hits localStorage again. */
export function resetConsentCache() {
  snapshot = null;
}
