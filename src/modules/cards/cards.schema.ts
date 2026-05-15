import { z } from "zod";

const intParam = z.preprocess((value) => {
	const parsed = typeof value === "string" || typeof value === "number"
		? Number(value)
		: Number.NaN;
	return Number.isFinite(parsed) ? parsed : undefined;
}, z.number().int());

export const listCardsSchema = z.object({
	params: z.object({
		deckId: intParam,
	}),
});

export const createCardSchema = z.object({
	params: z.object({
		deckId: intParam,
	}),
	body: z.object({
		front: z.string().trim().min(1),
		back: z.string().trim().min(1),
	}),
});

export const updateCardSchema = z.object({
	params: z.object({
		deckId: intParam,
		id: intParam,
	}),
	body: z.object({
		front: z.string().trim().min(1).optional(),
		back: z.string().trim().min(1).optional(),
	}).refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided for update",
	}),
});

export const deleteCardSchema = z.object({
	params: z.object({
		deckId: intParam,
		id: intParam,
	}),
});

export type CreateCardBody = z.infer<typeof createCardSchema>["body"];
export type UpdateCardBody = z.infer<typeof updateCardSchema>["body"];
export type DeckIdParams = z.infer<typeof listCardsSchema>["params"];
export type CardParams = z.infer<typeof deleteCardSchema>["params"];
