import { z } from "zod";

export const createFlashcardSchema = z.object({
  body: z.object({
    deck_id: z.number().int().positive(),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional().nullable(),
    question: z.string().min(1),
    answer: z.string().min(1),
  }),
});

export const updateFlashcardSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z.object({
    deck_id: z.number().int().positive().optional(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    question: z.string().min(1).optional(),
    answer: z.string().min(1).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
});

export const flashcardIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});

export type CreateFlashcardBody = z.infer<typeof createFlashcardSchema>["body"];
export type UpdateFlashcardBody = z.infer<typeof updateFlashcardSchema>["body"];
