import { z } from "zod";

export const COLLABORATION_TYPES = [
  "project",
  "ai_agent",
  "ai_setup",
  "consulting",
  "opensource",
  "speaking",
  "other",
] as const;

export type CollaborationType = (typeof COLLABORATION_TYPES)[number];

export function isCollaborationType(
  value: string | null | undefined,
): value is CollaborationType {
  return (COLLABORATION_TYPES as readonly string[]).includes(value ?? "");
}

export const collaborateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  collaborationType: z.enum(COLLABORATION_TYPES, {
    message: "Please select a collaboration type",
  }),
  description: z.string().min(20, "Please provide at least 20 characters"),
  budget: z
    .enum(["unsure", "under_1k", "1k_5k", "5k_15k", "over_15k"])
    .optional(),
  timeline: z.enum(["no_rush", "1_3_months", "3_6_months", "asap"]).optional(),
  referral: z
    .enum(["google", "github", "linkedin", "referral", "other"])
    .optional(),
});

export const collaborateSchema = collaborateFormSchema.extend({
  locale: z.enum(["en", "es"]).default("en"),
});

export type CollaborateFormData = z.infer<typeof collaborateFormSchema>;
export type CollaborateSubmission = z.infer<typeof collaborateSchema>;
