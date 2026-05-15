import { createHash } from "node:crypto";

import { NextFunction, Request, RequestHandler, Response } from "express";

import { RATE_LIMITS, RateLimitProfile } from "../config/rateLimits";

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

type CookieRequest = Request & {
	cookies?: {
		refresh_token?: string;
	};
};

const buckets = new Map<string, RateLimitEntry>();
let requestsSinceCleanup = 0;

const hashValue = (value: string) => createHash("sha256").update(value).digest("hex");

const getIpKey = (req: Request) => req.ip ?? req.socket.remoteAddress ?? "unknown-ip";

const getUserKey = (req: Request) => req.user?.userId ?? req.session?.user?.userId;

const getRefreshTokenKey = (req: Request) => {
	const refreshToken = (req as CookieRequest).cookies?.refresh_token;
	return refreshToken ? `refresh:${hashValue(refreshToken)}` : undefined;
};

const getRateLimitKey = (req: Request, profile: RateLimitProfile) => {
	switch (profile.key) {
		case "userOrIp":
			return getUserKey(req) ?? `ip:${getIpKey(req)}`;
		case "refreshTokenOrIp":
			return getRefreshTokenKey(req) ?? `ip:${getIpKey(req)}`;
		case "ip":
		default:
			return `ip:${getIpKey(req)}`;
	}
};

const cleanupExpiredBuckets = (now: number) => {
	requestsSinceCleanup += 1;

	if (requestsSinceCleanup < 1_000) {
		return;
	}

	requestsSinceCleanup = 0;

	for (const [key, entry] of buckets) {
		if (entry.resetAt <= now) {
			buckets.delete(key);
		}
	}
};

const setRateLimitHeaders = (res: Response, profile: RateLimitProfile, entry: RateLimitEntry) => {
	const now = Date.now();
	const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
	const remaining = Math.max(profile.maxRequests - entry.count, 0);

	res.setHeader("RateLimit-Limit", profile.maxRequests);
	res.setHeader("RateLimit-Remaining", remaining);
	res.setHeader("RateLimit-Reset", resetSeconds);
	res.setHeader("RateLimit-Policy", `${profile.maxRequests};w=${Math.ceil(profile.windowMs / 1000)}`);
};

export const createRateLimiter = (profile: RateLimitProfile): RequestHandler => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!RATE_LIMITS.enabled || !profile.enabled) {
			next();
			return;
		}

		const now = Date.now();
		cleanupExpiredBuckets(now);

		const key = `${profile.id}:${getRateLimitKey(req, profile)}`;
		const current = buckets.get(key);
		const entry = current && current.resetAt > now
			? current
			: { count: 0, resetAt: now + profile.windowMs };

		entry.count += 1;
		buckets.set(key, entry);
		setRateLimitHeaders(res, profile, entry);

		if (entry.count > profile.maxRequests) {
			const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
			res.setHeader("Retry-After", retryAfterSeconds);
			res.status(429).json({
				error: profile.message,
				retryAfterSeconds,
			});
			return;
		}

		next();
	};
};

export const rateLimiter = createRateLimiter(RATE_LIMITS.http.global);

export const authCsrfRateLimiter = createRateLimiter(RATE_LIMITS.http.authCsrf);
export const authOAuthUrlRateLimiter = createRateLimiter(RATE_LIMITS.http.authOAuthUrl);
export const authOAuthCallbackRateLimiter = createRateLimiter(RATE_LIMITS.http.authOAuthCallback);
export const authRefreshRateLimiter = createRateLimiter(RATE_LIMITS.http.authRefresh);
export const authSessionReadRateLimiter = createRateLimiter(RATE_LIMITS.http.authSessionRead);
export const authLogoutRateLimiter = createRateLimiter(RATE_LIMITS.http.authLogout);

export const aiGenerateDeckIpRateLimiter = createRateLimiter(RATE_LIMITS.http.aiGenerateDeckIp);
export const aiGenerateDeckUserBurstRateLimiter = createRateLimiter(RATE_LIMITS.http.aiGenerateDeckUserBurst);
export const aiGenerateDeckUserDailyRateLimiter = createRateLimiter(RATE_LIMITS.http.aiGenerateDeckUserDaily);

export const deckMutationRateLimiter = createRateLimiter(RATE_LIMITS.http.deckMutation);
export const cardMutationRateLimiter = createRateLimiter(RATE_LIMITS.http.cardMutation);
export const sessionSubmitRateLimiter = createRateLimiter(RATE_LIMITS.http.sessionSubmit);
export const emotionSessionStartRateLimiter = createRateLimiter(RATE_LIMITS.http.emotionSessionStart);
