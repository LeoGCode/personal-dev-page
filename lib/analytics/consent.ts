import { useSyncExternalStore } from "react";

/**
 * Cookie consent, kept in localStorage (the choice itself is strictly necessary storage).
 * - pending: only what BEFORE_CHOICE in config.ts allows (anonymous counts, no identifier); no ad
 *   tags, no replay.
 * - granted: PostHog persistence + session replay, Meta pixel, Google Ads tag, Sentry replay.
 * - denied: nothing is loaded or sent.
 * Every open tab follows a change made in another tab (the `storage` event).
 * Bump the key version to ask everyone again (e.g. after adding a vendor).
 */
export type ConsentChoice = "granted" | "denied" | "pending";

export const CONSENT_STORAGE_KEY = "leogcode-consent-v1";

export interface ConsentSnapshot {
  choice: ConsentChoice;
  /** Whether the banner is showing: no choice yet, or reopened from the privacy page. */
  open: boolean;
  /** Where the current choice came from: storage at load, a click in this tab, or another tab. */
  origin: "stored" | "this-tab" | "other-tab";
}

let snapshot: ConsentSnapshot | null = null;
const listeners = new Set<() => void>();

function parseChoice(value: string | null): ConsentChoice {
  return value === "granted" || value === "denied" ? value : "pending";
}

function readStoredChoice(): ConsentChoice {
  try {
    return parseChoice(window.localStorage.getItem(CONSENT_STORAGE_KEY));
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
    snapshot = { choice, open: choice === "pending", origin: "stored" };
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
  emit({ choice, open: false, origin: "this-tab" });
}

/** Shows the banner again so the visitor can change their choice. */
export function reopenConsent() {
  emit({ ...getConsentSnapshot(), open: true });
}

/**
 * Another tab accepted, rejected or withdrew: apply it here too. A removed key (site data
 * cleared) means no choice, so the banner shows again.
 */
export function onStorageEvent(event: Pick<StorageEvent, "key" | "newValue">) {
  if (event.key !== CONSENT_STORAGE_KEY && event.key !== null) return;
  const choice =
    event.key === null ? readStoredChoice() : parseChoice(event.newValue);
  const current = getConsentSnapshot();
  if (choice === current.choice) return;
  emit({ choice, open: choice === "pending", origin: "other-tab" });
}

let listening = false;

export function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  if (!listening && typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("storage", onStorageEvent);
    listening = true;
  }
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
