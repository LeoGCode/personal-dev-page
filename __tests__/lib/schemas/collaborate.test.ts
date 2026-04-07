import { describe, it, expect } from "vitest";
import {
  collaborateFormSchema,
  collaborateSchema,
} from "@/lib/schemas/collaborate";

describe("collaborateFormSchema", () => {
  const validData = {
    name: "John Doe",
    email: "john@example.com",
    collaborationType: "project" as const,
    description: "I need help building a web application for my business.",
  };

  it("accepts valid data", () => {
    const result = collaborateFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts data with optional fields", () => {
    const result = collaborateFormSchema.safeParse({
      ...validData,
      budget: "1k_5k",
      timeline: "1_3_months",
      referral: "github",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = collaborateFormSchema.safeParse({
      ...validData,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = collaborateFormSchema.safeParse({
      ...validData,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short description", () => {
    const result = collaborateFormSchema.safeParse({
      ...validData,
      description: "Too short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid collaboration type", () => {
    const result = collaborateFormSchema.safeParse({
      ...validData,
      collaborationType: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects honeypot with content", () => {
    const result = collaborateFormSchema.safeParse({
      ...validData,
      honeypot: "spam bot filled this",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty honeypot", () => {
    const result = collaborateFormSchema.safeParse({
      ...validData,
      honeypot: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("collaborateSchema (server-side)", () => {
  const validData = {
    name: "John Doe",
    email: "john@example.com",
    collaborationType: "consulting" as const,
    description: "I need consulting help with my project architecture.",
  };

  it("defaults locale to en", () => {
    const result = collaborateSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("en");
    }
  });

  it("accepts es locale", () => {
    const result = collaborateSchema.safeParse({
      ...validData,
      locale: "es",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("es");
    }
  });

  it("rejects invalid locale", () => {
    const result = collaborateSchema.safeParse({
      ...validData,
      locale: "fr",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all collaboration types", () => {
    const types = [
      "project",
      "consulting",
      "opensource",
      "speaking",
      "other",
    ] as const;

    for (const type of types) {
      const result = collaborateSchema.safeParse({
        ...validData,
        collaborationType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all budget options", () => {
    const budgets = [
      "unsure",
      "under_1k",
      "1k_5k",
      "5k_15k",
      "over_15k",
    ] as const;

    for (const budget of budgets) {
      const result = collaborateSchema.safeParse({
        ...validData,
        budget,
      });
      expect(result.success).toBe(true);
    }
  });
});
