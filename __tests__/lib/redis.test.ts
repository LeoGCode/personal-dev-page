import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to reset the module between tests because the store is module-scoped
describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("allows first request", async () => {
    const { checkRateLimit } = await import("@/lib/redis");
    const allowed = await checkRateLimit("127.0.0.1");
    expect(allowed).toBe(true);
  });

  it("allows up to maxAttempts requests", async () => {
    const { checkRateLimit } = await import("@/lib/redis");
    const ip = "192.168.1.1";

    expect(await checkRateLimit(ip, 3)).toBe(true);
    expect(await checkRateLimit(ip, 3)).toBe(true);
    expect(await checkRateLimit(ip, 3)).toBe(true);
  });

  it("blocks after maxAttempts exceeded", async () => {
    const { checkRateLimit } = await import("@/lib/redis");
    const ip = "10.0.0.1";

    await checkRateLimit(ip, 2);
    await checkRateLimit(ip, 2);
    const blocked = await checkRateLimit(ip, 2);
    expect(blocked).toBe(false);
  });

  it("uses different counters per IP", async () => {
    const { checkRateLimit } = await import("@/lib/redis");

    await checkRateLimit("ip-a", 1);
    const result = await checkRateLimit("ip-b", 1);
    expect(result).toBe(true);
  });
});
