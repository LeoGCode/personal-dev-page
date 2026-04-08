/**
 * In-memory rate limiter.
 *
 * Suitable for single-instance deployments (Docker, `next start`) where the
 * Node.js process is long-lived. Counters reset on restart, which is
 * acceptable for a low-traffic contact form.
 *
 * On serverless platforms (Vercel, AWS Lambda) this implementation is
 * unreliable — each invocation may get a fresh instance with an empty store.
 * Use the Upstash Redis implementation instead (see rate-limit-upstash.ts).
 */
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
  if (
    cleanupTimer &&
    typeof cleanupTimer === "object" &&
    "unref" in cleanupTimer
  ) {
    cleanupTimer.unref();
  }
}

/**
 * Check whether a request from `ip` is within the rate limit.
 *
 * @param ip          Client identifier (IP address)
 * @param maxAttempts Maximum requests allowed within the window
 * @param windowMs    Time window in milliseconds (default: 1 hour)
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
