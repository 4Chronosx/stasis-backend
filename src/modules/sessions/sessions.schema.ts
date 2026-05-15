import { z } from "zod";

const toNumber = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
};

const intParam = z.preprocess((value) => {
  const parsed = toNumber(value);
  return typeof parsed === "number" ? parsed : undefined;
}, z.number().int());

const ratingSchema = z.preprocess((value) => {
  const parsed = toNumber(value);
  return typeof parsed === "number" ? parsed : value;
}, z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]));

const reviewSchema = z.object({
  cardId: intParam,
  rating: ratingSchema,
  reviewedAt: z.string().datetime(),
});

export const loadSessionSchema = z.object({
  params: z.object({
    deckId: intParam,
  }),
});

export const submitSessionSchema = z.object({
  params: z.object({
    deckId: intParam,
  }),
  body: z.object({
    reviews: z.array(reviewSchema).min(1).max(200),
  }),
});

export type SessionParams = z.infer<typeof loadSessionSchema>["params"];
export type Review = z.infer<typeof reviewSchema>;
export type SubmitSessionBody = z.infer<typeof submitSessionSchema>["body"];
