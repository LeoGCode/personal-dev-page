const store = new Map<string, { count: number; expiresAt: number }>();

// Periodically prune expired entries to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    }
    // Stop the timer when the store is empty to avoid keeping Node alive
    if (store.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL_MS);
  // Allow the process to exit even if the timer is running
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * In-memory rate limiter.
 *
 * @param ip        - Client identifier (IP address)
 * @param maxAttempts - Maximum requests allowed within the window
 * @param windowMs  - Time window in milliseconds (default: 1 hour)
 * @returns `true` if the request is allowed, `false` if rate-limited
 */
export async function checkRateLimit(
  ip: string,
  maxAttempts = 3,
  windowMs = 3_600_000,
): Promise<boolean> {
  const key = `collab:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (entry && entry.expiresAt > now) {
    entry.count++;
    return entry.count <= maxAttempts;
  }

  store.set(key, { count: 1, expiresAt: now + windowMs });
  startCleanup();
  return true;
}

/** Visible for testing — clears all rate limit entries. */
export function _resetStore() {
  store.clear();
}
