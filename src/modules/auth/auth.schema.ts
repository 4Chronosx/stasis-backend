import { z } from "zod";

const googleCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const googleCallbackSchema = z.object({
  query: googleCallbackQuerySchema,
});

export type GoogleCallbackQuery = z.infer<typeof googleCallbackSchema>["query"];

export const authorizationCodeTokenRequestSchema = z.object({
  code: z.string().min(1),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  redirect_uri: z.string().min(1),
  grant_type: z.literal("authorization_code"),
});

export type AuthorizationCodeTokenRequest = z.infer<
  typeof authorizationCodeTokenRequestSchema
>;
