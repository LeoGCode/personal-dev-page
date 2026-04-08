import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, _resetStore } from "@/lib/rate-limit-memory";

describe("checkRateLimit (in-memory)", () => {
  beforeEach(() => {
    _resetStore();
  });

  it("allows first request", async () => {
    const allowed = await checkRateLimit("127.0.0.1");
    expect(allowed).toBe(true);
  });

  it("allows up to maxAttempts requests", async () => {
    const ip = "192.168.1.1";
    expect(await checkRateLimit(ip, 3)).toBe(true);
    expect(await checkRateLimit(ip, 3)).toBe(true);
    expect(await checkRateLimit(ip, 3)).toBe(true);
  });

  it("blocks after maxAttempts exceeded", async () => {
    const ip = "10.0.0.1";
    await checkRateLimit(ip, 2);
    await checkRateLimit(ip, 2);
    const blocked = await checkRateLimit(ip, 2);
    expect(blocked).toBe(false);
  });

  it("uses different counters per IP", async () => {
    await checkRateLimit("ip-a", 1);
    const result = await checkRateLimit("ip-b", 1);
    expect(result).toBe(true);
  });

  it("resets after window expires", async () => {
    const ip = "10.0.0.2";
    // Use a very short window
    await checkRateLimit(ip, 1, 1);
    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 5));
    const allowed = await checkRateLimit(ip, 1, 1);
    expect(allowed).toBe(true);
  });
});
