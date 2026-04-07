const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

async function redisCommand(
  command: string,
  ...args: string[]
): Promise<string | null> {
  const url = new URL(REDIS_URL);
  // Use a simple HTTP-based approach or direct TCP
  // For simplicity, use fetch to a Redis REST API if available
  // In production, use ioredis or similar

  // Minimal Redis client using TCP (Node.js built-in)
  // For now, provide a simple in-memory fallback for development
  return inMemoryFallback(command, ...args);
}

// In-memory rate limiter for development (replace with Redis in production)
const store = new Map<string, { count: number; expiresAt: number }>();

function inMemoryFallback(command: string, ...args: string[]): string | null {
  const key = args[0];

  if (command === "INCR") {
    const entry = store.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      entry.count++;
      return String(entry.count);
    }
    store.set(key, { count: 1, expiresAt: Date.now() + 3600_000 });
    return "1";
  }

  if (command === "EXPIRE") {
    const entry = store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + Number(args[1]) * 1000;
    }
    return "OK";
  }

  if (command === "GET") {
    const entry = store.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return String(entry.count);
    }
    return null;
  }

  return null;
}

export async function checkRateLimit(
  ip: string,
  maxAttempts = 3,
): Promise<boolean> {
  const key = `collab:${ip}`;
  const count = await redisCommand("INCR", key);
  if (Number(count) === 1) {
    await redisCommand("EXPIRE", key, "3600");
  }
  return Number(count) <= maxAttempts;
}
