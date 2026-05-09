import { z } from "zod";

export const createDeckSchema = z.object({
	body: z.object({
		name: z.string().trim().min(1).optional(),
		cardCount: z.coerce.number().int().min(1).max(30).optional().default(10),
	}),
});

export type CreateDeckBody = z.infer<typeof createDeckSchema>["body"];
