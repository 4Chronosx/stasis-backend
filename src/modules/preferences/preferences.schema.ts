import { z } from "zod";

const scoreField = z.number().int().min(0).max(100);

export const runtimePreferencesSchema = z.object({
  privacy_comfort: z.enum(["visible", "hidden", "off"]),
  emotion_detection: z.boolean(),
  expression_tolerance: z.enum(["neutral", "intense", "variable"]),
  study_block_length: z.number().int().min(15).max(90),
  mini_breaks_per_session: z.number().int().min(1).max(3),
  break_mechanic: z.enum(["relaxed", "accountable"]),
  recovery_duration: z.number().int().min(3).max(30),
  show_timer: z.boolean(),
}).refine(
  (data) =>
    data.privacy_comfort !== "off" ||
    (!data.emotion_detection && data.break_mechanic === "relaxed"),
  {
    message:
      "Camera-off preferences must disable emotion detection and use relaxed breaks",
    path: ["privacy_comfort"],
  },
);

export const DEFAULT_RUNTIME_PREFERENCES: RuntimePreferences = {
  privacy_comfort: "off",
  emotion_detection: false,
  expression_tolerance: "neutral",
  study_block_length: 25,
  mini_breaks_per_session: 2,
  break_mechanic: "relaxed",
  recovery_duration: 10,
  show_timer: true,
};

export const runtimePreferencesRequestSchema = z.object({
  body: runtimePreferencesSchema,
});

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

export type RuntimePreferences = z.infer<typeof runtimePreferencesSchema>;
export type RuntimePreferencesBody = z.infer<typeof runtimePreferencesRequestSchema>["body"];
export type CreatePreferencesBody = z.infer<typeof createPreferencesSchema>["body"];
export type UpdatePreferencesBody = z.infer<typeof updatePreferencesSchema>["body"];
