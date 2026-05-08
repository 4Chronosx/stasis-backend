import { OAuth2Client } from "google-auth-library";
import { GoogleGenAI } from "@google/genai";
import { env, getRequiredEnv } from "./env";

export const google = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const google_ai = new GoogleGenAI({
    apiKey: getRequiredEnv("GEMINI_API_KEY"),
});

