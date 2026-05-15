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
		cardCount: z.coerce.number().int().min(1).max(30).optional().default(10),
	}),
});

export type CreateDeckBody = z.infer<typeof createDeckSchema>["body"];
export type DeckIdParams = z.infer<typeof deckIdSchema>["params"];
