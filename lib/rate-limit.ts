/**
 * Rate limiter facade — selects the right backend automatically.
 *
 * • Serverless (Vercel): set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   → uses Upstash Redis for durable, cross-invocation rate limiting.
 *
 * • Self-hosted (Docker / `next start`): leave those vars unset
 *   → uses in-memory Map, which is fine for a single long-lived process.
 */

export async function checkRateLimit(
  ip: string,
  maxAttempts = 3,
  windowMs = 3_600_000,
): Promise<boolean> {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const { checkRateLimit: upstash } = await import("./rate-limit-upstash");
    return upstash(ip, maxAttempts, windowMs);
  }

  const { checkRateLimit: memory } = await import("./rate-limit-memory");
  return memory(ip, maxAttempts, windowMs);
}

/**
 * Visible for testing — clears the in-memory store.
 * No-op when using Upstash (state lives in Redis, not in process memory).
 */
export async function _resetStore() {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    const { _resetStore: reset } = await import("./rate-limit-memory");
    reset();
  }
}
