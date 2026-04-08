/**
 * Redis-backed rate limiter using Upstash.
 *
 * Designed for serverless environments (Vercel, AWS Lambda) where in-memory
 * state does not persist across invocations. Upstash Redis is accessed over
 * HTTP (no persistent TCP connection), which is ideal for serverless.
 *
 * Requires two environment variables:
 *   UPSTASH_REDIS_REST_URL   — e.g. https://us1-xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN — the REST API token from the Upstash console
 *
 * Uses a sliding-window algorithm for accurate rate limiting.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _ratelimit: Ratelimit | null = null;

function getRatelimit(maxAttempts: number, windowMs: number): Ratelimit {
  // Cache the instance for warm invocations (same Lambda container).
  // Parameters are fixed per deployment, so a single cached instance is fine.
  if (_ratelimit) return _ratelimit;

  const redis = Redis.fromEnv();

  _ratelimit = new Ratelimit({
    redis,
    // Sliding window: `maxAttempts` requests per `windowMs` milliseconds.
    limiter: Ratelimit.slidingWindow(maxAttempts, `${windowMs} ms`),
    prefix: "ratelimit:collab",
    analytics: false,
  });

  return _ratelimit;
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
  const limiter = getRatelimit(maxAttempts, windowMs);
  const { success } = await limiter.limit(ip);
  return success;
}
