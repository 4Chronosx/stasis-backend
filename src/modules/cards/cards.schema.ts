import { z } from "zod";

export const createCardSchema = z.object({
	body: z.object({
		front: z.string().trim().min(1),
		back: z.string().trim().min(1),
	}),
});

export const updateCardSchema = z.object({
	body: z.object({
		front: z.string().trim().min(1).optional(),
		back: z.string().trim().min(1).optional(),
	}).refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	}),
});

export type CreateCardBody = z.infer<typeof createCardSchema>["body"];
export type UpdateCardBody = z.infer<typeof updateCardSchema>["body"];
