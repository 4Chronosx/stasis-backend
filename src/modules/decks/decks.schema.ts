import { z } from "zod";

const intParam = z.preprocess((value) => {
	const parsed = typeof value === "string" || typeof value === "number"
		? Number(value)
		: Number.NaN;
	return Number.isFinite(parsed) ? parsed : undefined;
}, z.number().int());

export const deckIdSchema = z.object({
	params: z.object({
		id: intParam,
	}),
});

export const createDeckSchema = z.object({
	body: z.object({
		name: z.string().trim().min(1).optional(),
		description: z.string().trim().optional(),
		cardCount: z.coerce.number().int().min(10).max(30).optional().default(10),
	}),
});

export const updateDeckSchema = z.object({
	params: z.object({
		id: intParam,
	}),
	body: z.object({
		name: z.string().trim().min(1).optional(),
		description: z.string().trim().optional(),
	}).refine((data) => data.name !== undefined || data.description !== undefined, {
		message: "At least one field (name or description) must be provided",
	}),
});

export type CreateDeckBody = z.infer<typeof createDeckSchema>["body"];
export type UpdateDeckBody = z.infer<typeof updateDeckSchema>["body"];
export type DeckIdParams = z.infer<typeof deckIdSchema>["params"];
