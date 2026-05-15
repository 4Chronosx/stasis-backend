import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { env } from "../config/env";
import { AppSession, SessionUser } from "../types";

export type AccessTokenPayload = JwtPayload & SessionUser;

type RequestCookies = {
	access_token?: string;
	refresh_token?: string;
	csrf_token?: string;
	oauth_state?: string;
};

export type CookieRequest<
	P = Record<string, string>,
	ResBody = unknown,
	ReqBody = unknown,
	ReqQuery = Record<string, unknown>,
> = Request<P, ResBody, ReqBody, ReqQuery> & {
	cookies: RequestCookies;
	session?: AppSession;
	user?: SessionUser;
};

export type AuthRequest = CookieRequest & { user?: AccessTokenPayload };

const ACCESS_TOKEN_COOKIE_NAME = "access_token";

const isAccessTokenPayload = (value: unknown): value is AccessTokenPayload => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const payload = value as Record<string, unknown>;
	return (
		typeof payload.userId === "string" &&
		typeof payload.email === "string" &&
		typeof payload.name === "string" &&
		typeof payload.pictureUrl === "string"
	);
};

const parseCookieHeader = (cookieHeader: string | undefined): RequestCookies => {
	if (!cookieHeader) {
		return {};
	}

	return cookieHeader.split(";").reduce<RequestCookies>((cookies, cookie) => {
		const [rawName, ...rawValueParts] = cookie.split("=");

		if (!rawName || rawValueParts.length === 0) {
			return cookies;
		}

		const name = rawName.trim() as keyof RequestCookies;
		const value = rawValueParts.join("=").trim();

		if (value.length > 0) {
			cookies[name] = decodeURIComponent(value);
		}

		return cookies;
	}, {});
};

const getRequestCookies = (req: CookieRequest): RequestCookies => {
	if (req.cookies && Object.keys(req.cookies).length > 0) {
		return req.cookies;
	}

	const rawCookieHeader = typeof req.headers.cookie === "string" ? req.headers.cookie : undefined;
	return parseCookieHeader(rawCookieHeader);
};

const verifyAccessToken = (accessToken: string | undefined): AccessTokenPayload | null => {
	if (!accessToken || !env.JWT_SECRET) {
		return null;
	}

	try {
		const decoded = jwt.verify(accessToken, env.JWT_SECRET);
		return isAccessTokenPayload(decoded) ? decoded : null;
	} catch {
		return null;
	}
};

export const hydrateRequestSession: RequestHandler = (req, _res, next) => {
	const cookieRequest = req as CookieRequest;

	cookieRequest.session ??= {};

	const cookies = getRequestCookies(cookieRequest);
	cookieRequest.cookies = cookies;

	const decoded = verifyAccessToken(cookies[ACCESS_TOKEN_COOKIE_NAME]);

	if (decoded) {
		cookieRequest.session.user = decoded;
		cookieRequest.user = decoded;
	} else if (cookieRequest.session.user) {
		delete cookieRequest.session.user;
	}

	next();
};

export const authenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
	const sessionUser = req.session?.user;

	if (sessionUser) {
		req.user = sessionUser;
		next();
		return;
	}

	const decoded = verifyAccessToken(getRequestCookies(req)[ACCESS_TOKEN_COOKIE_NAME]);

	if (!decoded) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}

	req.session ??= {};
	req.session.user = decoded;
	req.user = decoded;
	next();
};

export const validateCsrf = (req: CookieRequest, res: Response, next: NextFunction) => {
	const cookieToken = getRequestCookies(req).csrf_token;
	const rawHeader = req.headers["x-csrf-token"];
	const headerToken = typeof rawHeader === "string" ? rawHeader : undefined;

	if (!cookieToken || cookieToken !== headerToken) {
		res.status(403).json({ error: "Invalid CSRF token" });
		return;
	}

	next();
};
