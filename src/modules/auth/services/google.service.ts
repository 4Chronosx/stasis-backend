import { URLSearchParams } from "node:url";
import {
    authorizationCodeTokenRequestSchema,
    type AuthorizationCodeTokenRequest,
} from "../auth.schema";

export const AuthService = {
    generateUrl: (params: URLSearchParams) => {
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },

    exchangeCode: async (tokenRequest: AuthorizationCodeTokenRequest) => {
        authorizationCodeTokenRequestSchema.parse(tokenRequest);

        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ ...tokenRequest })
        });

        if (!response.ok) {
            const error = await response.json() as { error: string };
            throw new Error(`Token exchange failed: ${error.error}`);
        }

        const data = await response.json() as { id_token?: string };

        if (!data.id_token) {
            throw new Error("No id_token in response");
        }

        return { id_token: data.id_token };
    }
}