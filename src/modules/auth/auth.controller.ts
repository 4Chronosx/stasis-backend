import { Request, Response } from 'express';
import { AuthService } from './services/google.service'; 
import { UserService } from './services/user.service'; 
import { google } from '../../config/google'; 
import { AuthRequest, CookieRequest } from '../../middleware/auth.middleware';
import { RefreshTokenService } from './services/refresh.service';
import { TokenService } from './services/token.service';
import { env } from '../../config/env';
import { PreferencesService } from '../preferences/preferences.service';

interface AuthorizationCodeTokenRequest {
    code: string,
    client_id: string,
    client_secret: string,
    redirect_uri: string,
    grant_type: 'authorization_code';
}

const FRONTEND_URL = env.CLIENT_URL;
const isProduction = env.NODE_ENV == "production";

function buildFrontendUrl(path: string) {
    return new URL(path, FRONTEND_URL).toString();
}

export const url = (req: Request, res: Response) => {
    try {
        const state = crypto.randomUUID();

        res.cookie("oauth_state", state, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 5 * 60 * 1000
        });

        const params = new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID!,
            redirect_uri: env.GOOGLE_CALLBACK_URL!,
            response_type: "code",
            state,
            scope: [
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
            ].join(" "),
        });

        const authUrl = AuthService.generateUrl(params);
        res.json({ url: authUrl });
    } catch(error) {
        console.error("Failed to generate OAuth URL:", error);
        res.status(500).json({ error: "Failed to initiate OAuth flow" });
    }
}

type CallbackQuery = {
    code?: string;
    state?: string;
    error?: string;
};

export const callback = async(req: CookieRequest<Record<string, never>, unknown, unknown, CallbackQuery>, res: Response) => {
    const { code, state, error } = req.query;
    const storedState = req.cookies.oauth_state;

    if (error) {
        return res.redirect(buildFrontendUrl("/auth/error?error=authentication_failed"));
    }

    if (!code || !state) {
        return res.redirect(buildFrontendUrl("/auth/error?error=missing_code_or_state"));
    }

    if (!storedState || state !== storedState) {
        return res.redirect(buildFrontendUrl("/auth/error?error=state_mismatch"));
    }

    res.clearCookie("oauth_state");

    const tokenRequest: AuthorizationCodeTokenRequest = {
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: env.GOOGLE_CALLBACK_URL!,
        grant_type: 'authorization_code'
    }

    try {
        const response = await AuthService.exchangeCode(tokenRequest);

        const ticket = await google.verifyIdToken({
            idToken: response.id_token,
            audience: env.GOOGLE_CLIENT_ID!,
        });
        const payload = ticket.getPayload();

        if (!payload) {
            return res.redirect(buildFrontendUrl("/auth/error?error=invalid_payload"));
        }

        if (!payload.email_verified) {
            return res.redirect(buildFrontendUrl("/auth/error?error=email_not_verified"));
        }

        const user = await UserService.upsert({
            googleId: payload.sub,
            email: payload.email!,
            fullname: payload.name!,
            picture: payload.picture ?? '',
        });

        if (!user) {
            return res.redirect(buildFrontendUrl("/auth/error?error=user_upsert_failed"));
        }

        const preferences = await PreferencesService.ensureForUser(user.id);

        if (!preferences) {
            return res.redirect(buildFrontendUrl("/auth/error?error=preferences_init_failed"));
        }

        const name = user.fullname ?? "";
        const pictureUrl = user.pictureUrl ?? "";

        const accessToken = TokenService.generateAccessToken({
            userId: user.id,
            email: user.email,
            name,
            pictureUrl,
        });

        const refreshToken = TokenService.generateRefreshToken();

        await RefreshTokenService.create({
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log("[OAUTH] Cookies set successfully for user:", user.email);
        console.log("[OAUTH] Redirecting to:", buildFrontendUrl("/auth/callback?next=/dashboard"));
        res.redirect(buildFrontendUrl("/auth/callback?next=/dashboard")); 
    } catch (error) {
        console.error("Token exchange failed:", error);
        res.redirect(buildFrontendUrl("/auth/error?error=token_exchange_failed"));
    }
}

export const verify = (req: AuthRequest, res: Response) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json({
        user: {
            id: user.userId,
            userId: user.userId,
            email: user.email,
            name: user.name,
            pictureUrl: user.pictureUrl ?? ""
        },
    });
}

export const logout = async (req: AuthRequest, res: Response) => {
    const refreshToken = req.cookies.refresh_token;

    if (refreshToken) {
        await RefreshTokenService.delete(refreshToken);
    }

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' as const : 'lax' as const,
        path: '/',
    };

    res.clearCookie("access_token", cookieOptions);
    res.clearCookie("refresh_token", cookieOptions);
    res.json({ message: "Logged out" });
};

export const csrfToken = (req: CookieRequest, res: Response) => {
    const token = crypto.randomUUID();
    res.cookie("csrf_token", token, {
        httpOnly: false,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
    });
    res.json({ csrfToken: token });
}

export const refresh = async (req: CookieRequest, res: Response) => {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token" });
    }

    try {
        const storedToken = await RefreshTokenService.find(refreshToken);

        if (!storedToken) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        const user = await UserService.findById(storedToken.user_id);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const name = user.fullname ?? "";
        const pictureUrl = user.pictureUrl ?? "";

        const accessToken = TokenService.generateAccessToken({
            userId: user.id,
            email: user.email,
            name,
            pictureUrl,
        });

        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 15 * 60 * 1000
        });

        res.json({ message: "Token refreshed" });
    } catch (error) {
        console.error("Refresh failed:", error);
        res.status(401).json({ message: "Invalid refresh token" });
    }
}

export const getToken = (req: CookieRequest, res: Response) => {
    const accessToken = req.cookies.access_token;
    res.json({ access_token: accessToken });
};
