import { z } from "zod";

const sessionTypeValues = ["pomodoro", "study", "other"] as const;
const trendGranularityValues = ["daily", "weekly", "monthly"] as const;

export type SessionType = (typeof sessionTypeValues)[number];
export type TrendGranularity = (typeof trendGranularityValues)[number];

const toNumber = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const positiveIntFromQuery = z
  .preprocess((value) => {
    const parsed = toNumber(value);
    return parsed !== undefined && parsed > 0 ? parsed : undefined;
  }, z.number().int().positive())
  .optional();

const nonNegativeIntFromQuery = z
  .preprocess((value) => {
    const parsed = toNumber(value);
    return parsed !== undefined && parsed >= 0 ? parsed : undefined;
  }, z.number().int().min(0))
  .optional();

const sessionTypeSchema = z
  .preprocess((value) => {
    if (typeof value !== "string") return undefined;
    return sessionTypeValues.includes(value as SessionType) ? value : undefined;
  }, z.enum(sessionTypeValues))
  .optional()
  .default("pomodoro");

const metadataSchema = z
  .preprocess((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }
    return value;
  }, z.record(z.string(), z.unknown()))
  .optional();

const snapshotSchema = z.object({
  emotion: z.string(),
  gaze: z.string(),
  confusion: z.boolean(),
  timestamp: z.number(),
  confidence: z.number().optional(),
});

export type SnapshotInput = z.infer<typeof snapshotSchema>;

export const startSessionSchema = z.object({
  body: z.object({
    sessionType: sessionTypeSchema,
    metadata: metadataSchema,
  }),
});

export const addSnapshotsSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
  body: z.object({
    snapshots: z.array(snapshotSchema).min(1),
  }),
});

export const endSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
  body: z
    .object({
      endedAt: z.string().datetime().optional(),
    })
    .optional(),
});

export const getSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
});

export const deleteSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
});


export const listHistorySchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sessionType: z
      .preprocess((value) => {
        if (typeof value !== "string") return undefined;
        return sessionTypeValues.includes(value as SessionType) ? value : undefined;
      }, z.enum(sessionTypeValues))
      .optional(),
    limit: positiveIntFromQuery.default(50),
    offset: nonNegativeIntFromQuery.default(0),
  }),
});

export const getTrendsSchema = z.object({
  query: z.object({
    granularity: z
      .preprocess((value) => {
        if (typeof value !== "string") return undefined;
        return trendGranularityValues.includes(value as TrendGranularity)
          ? value
          : undefined;
      }, z.enum(trendGranularityValues))
      .optional()
      .default("daily"),
    days: positiveIntFromQuery.default(30),
  }),
});

export type StartSessionBody = z.infer<typeof startSessionSchema>["body"];
export type AddSnapshotsBody = z.infer<typeof addSnapshotsSchema>["body"];
export type EmotionSessionParams = z.infer<typeof getSessionSchema>["params"];
export type EndSessionBody = z.infer<typeof endSessionSchema>["body"];
export type ListHistoryQuery = z.infer<typeof listHistorySchema>["query"];
export type TrendsQuery = z.infer<typeof getTrendsSchema>["query"];
