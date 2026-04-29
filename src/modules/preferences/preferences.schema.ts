import { z } from "zod";

const scoreField = z.number().int().min(0).max(100);

export const createPreferencesSchema = z.object({
  body: z.object({
    attention_score: scoreField.optional().default(0),
    adhd_score: scoreField.optional().default(0),
    stress_score: scoreField.optional().default(0),
    memory_score: scoreField.optional().default(0),
    speed_score: scoreField.optional().default(0),
    grit_score: scoreField.optional().default(0),
    motivation_score: scoreField.optional().default(0),
    adaptive_params: z.record(z.string(), z.unknown()).optional().default({}),
    onboarding_completed: z.boolean().optional().default(false),
  }),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    attention_score: scoreField.optional(),
    adhd_score: scoreField.optional(),
    stress_score: scoreField.optional(),
    memory_score: scoreField.optional(),
    speed_score: scoreField.optional(),
    grit_score: scoreField.optional(),
    motivation_score: scoreField.optional(),
    adaptive_params: z.record(z.string(), z.unknown()).optional(),
    onboarding_completed: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
});

export type CreatePreferencesBody = z.infer<typeof createPreferencesSchema>["body"];
export type UpdatePreferencesBody = z.infer<typeof updatePreferencesSchema>["body"];
