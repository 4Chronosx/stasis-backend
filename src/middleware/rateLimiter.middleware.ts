import crypto from "crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { rateLimitConfig, type LimiterSettings } from "../config/rateLimits";

type RequestWithRateLimitContext = Request & {
	user?: { userId?: string };
};

type FixedWindowBucket = {
	count: number;
	resetAt: number;
};

const activeAiGenerations = new Map<string, number>();
const sessionReviewBuckets = new Map<string, FixedWindowBucket>();
const concurrencyRetryWindowMs = 60 * 1000;

const noopLimiter: RequestHandler = (_req, _res, next) => {
	next();
};

const normalizeIpKey = (ip: string | undefined): string => {
	if (!ip) return "ip:unknown";

	try {
		return `ip:${ipKeyGenerator(ip)}`;
	} catch {
		return `ip:${ip}`;
	}
};

const getIpKey = (req: Request): string => {
	return normalizeIpKey(req.ip ?? req.socket.remoteAddress);
};

const getUserId = (req: Request): string | undefined => {
	const request = req as RequestWithRateLimitContext;
	return request.user?.userId;
};

const getCookie = (req: Request, name: string): string | undefined => {
	const cookies = (req as { cookies?: unknown }).cookies;
	if (!cookies || typeof cookies !== "object") return undefined;

	const value = (cookies as Record<string, unknown>)[name];
	return typeof value === "string" ? value : undefined;
};

const hashValue = (value: string): string => {
	return crypto.createHash("sha256").update(value).digest("hex");
};

const getStringParam = (req: Request, name: string): string | undefined => {
	const value = req.params[name];
	return typeof value === "string" && value.length > 0 ? value : undefined;
};

const keyByIp = (req: Request) => getIpKey(req);

const keyByUserOrIp = (req: Request) => {
	const userId = getUserId(req);
	return userId ? `user:${userId}` : getIpKey(req);
};

const keyByUserDeckOrIp = (req: Request) => {
	const deckId = getStringParam(req, "deckId") ?? getStringParam(req, "id") ?? "unknown";
	const userId = getUserId(req);
	return userId ? `user:${userId}:deck:${deckId}` : `${getIpKey(req)}:deck:${deckId}`;
};

const keyByRefreshTokenOrIp = (req: Request) => {
	const refreshToken = getCookie(req, "refresh_token");
	return refreshToken ? `refresh:${hashValue(refreshToken)}` : getIpKey(req);
};

const keyByOAuthStateOrIp = (req: Request) => {
	const cookieState = getCookie(req, "oauth_state");
	const queryState = typeof req.query.state === "string" ? req.query.state : undefined;
	const state = cookieState ?? queryState;
	return state ? `oauth-state:${hashValue(state)}` : getIpKey(req);
};

const isTrustedRequest = (req: Request): boolean => {
	if (process.env.NODE_ENV === "test") return true;

	const requestIp = req.ip;
	const socketIp = req.socket.remoteAddress;
	const isTrustedIp =
		(requestIp ? rateLimitConfig.trustedIps.includes(requestIp) : false) ||
		(socketIp ? rateLimitConfig.trustedIps.includes(socketIp) : false);

	if (isTrustedIp) return true;

	const internalToken = rateLimitConfig.internalToken;
	if (!internalToken) return false;

	const header = req.headers["x-internal-rate-limit-token"];
	return typeof header === "string" && header === internalToken;
};

const retryAfterSeconds = (settings: LimiterSettings): number => {
	return Math.ceil(settings.windowMs / 1000);
};

const rateLimitResponse = (name: string, settings: LimiterSettings) => ({
	error: "Too many requests",
	limiter: name,
	retryAfterSeconds: retryAfterSeconds(settings),
});

const monitorOrBlock = (
	name: string,
	settings: LimiterSettings,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (rateLimitConfig.mode === "monitor") {
		console.warn(`[RATE_LIMIT][monitor] ${name} would block ${req.method} ${req.originalUrl}`);
		next();
		return;
	}

	res.setHeader("Retry-After", String(retryAfterSeconds(settings)));
	res.status(429).json(rateLimitResponse(name, settings));
};

const createNamedLimiter = (
	name: string,
	settings: LimiterSettings,
	keyGenerator: (req: Request, res: Response) => string,
): RequestHandler => {
	if (!rateLimitConfig.enabled || !settings.enabled) {
		return noopLimiter;
	}

	return rateLimit({
		windowMs: settings.windowMs,
		limit: settings.max,
		identifier: name,
		standardHeaders: "draft-8",
		legacyHeaders: false,
		keyGenerator,
		skip: (req) => isTrustedRequest(req),
		handler: (req, res, next) => {
			monitorOrBlock(name, settings, req, res, next);
		},
	});
};

const isLimiterActive = (settings: LimiterSettings, groupEnabled = true): boolean => {
	return rateLimitConfig.enabled && settings.enabled && groupEnabled;
};

export const globalLimiter = createNamedLimiter("global", rateLimitConfig.global, keyByIp);
export const publicLimiter = createNamedLimiter("public", rateLimitConfig.public, keyByIp);
export const docsLimiter = createNamedLimiter("docs", rateLimitConfig.docs, keyByIp);

export const csrfLimiter = createNamedLimiter("auth-csrf", rateLimitConfig.csrf, keyByIp);
export const authUrlTenMinuteLimiter = createNamedLimiter(
	"auth-google-url-10m",
	rateLimitConfig.authUrlTenMinute,
	keyByIp,
);
export const authUrlHourLimiter = createNamedLimiter("auth-google-url-hour", rateLimitConfig.authUrlHour, keyByIp);
export const oauthCallbackLimiter = createNamedLimiter(
	"auth-google-callback",
	rateLimitConfig.oauthCallback,
	keyByOAuthStateOrIp,
);
export const refreshTokenMinuteLimiter = createNamedLimiter(
	"auth-refresh-token-minute",
	rateLimitConfig.refreshTokenMinute,
	keyByRefreshTokenOrIp,
);
export const refreshIpFiveMinuteLimiter = createNamedLimiter(
	"auth-refresh-ip-5m",
	rateLimitConfig.refreshIpFiveMinute,
	keyByIp,
);
export const sessionPollLimiter = createNamedLimiter("auth-session-poll", rateLimitConfig.sessionPoll, keyByUserOrIp);
export const logoutLimiter = createNamedLimiter("auth-logout", rateLimitConfig.logout, keyByUserOrIp);

export const deckReadLimiter = createNamedLimiter("deck-read", rateLimitConfig.deckRead, keyByUserOrIp);
export const deckDeleteMinuteLimiter = createNamedLimiter(
	"deck-delete-minute",
	rateLimitConfig.deckDeleteMinute,
	keyByUserOrIp,
);
export const deckDeleteHourLimiter = createNamedLimiter(
	"deck-delete-hour",
	rateLimitConfig.deckDeleteHour,
	keyByUserOrIp,
);

export const aiGenerationAccountHourLimiter = createNamedLimiter(
	"ai-generation-account-hour",
	rateLimitConfig.ai.accountHour,
	keyByUserOrIp,
);
export const aiGenerationAccountDayLimiter = createNamedLimiter(
	"ai-generation-account-day",
	rateLimitConfig.ai.accountDay,
	keyByUserOrIp,
);
export const aiGenerationIpHourLimiter = createNamedLimiter(
	"ai-generation-ip-hour",
	rateLimitConfig.ai.ipHour,
	keyByIp,
);

export const cardReadLimiter = createNamedLimiter("card-read", rateLimitConfig.cardRead, keyByUserDeckOrIp);
export const cardWriteMinuteLimiter = createNamedLimiter(
	"card-write-minute",
	rateLimitConfig.cardWriteMinute,
	keyByUserDeckOrIp,
);
export const cardWriteHourLimiter = createNamedLimiter(
	"card-write-hour",
	rateLimitConfig.cardWriteHour,
	keyByUserDeckOrIp,
);

export const sessionLoadLimiter = createNamedLimiter(
	"study-session-load",
	rateLimitConfig.sessionLoad,
	keyByUserDeckOrIp,
);
export const preferencesReadLimiter = createNamedLimiter(
	"preferences-read",
	rateLimitConfig.preferencesRead,
	keyByUserOrIp,
);
export const preferencesWriteMinuteLimiter = createNamedLimiter(
	"preferences-write-minute",
	rateLimitConfig.preferencesWriteMinute,
	keyByUserOrIp,
);
export const preferencesWriteDayLimiter = createNamedLimiter(
	"preferences-write-day",
	rateLimitConfig.preferencesWriteDay,
	keyByUserOrIp,
);
export const sessionReviewRequestLimiter = createNamedLimiter(
	"study-session-review-request",
	rateLimitConfig.sessionReviews.requestMinute,
	keyByUserDeckOrIp,
);

export const aiGenerationConcurrencyLimiter: RequestHandler = (req, res, next) => {
	const settings = rateLimitConfig.ai;
	if (!rateLimitConfig.enabled || !settings.enabled || isTrustedRequest(req)) {
		next();
		return;
	}

	const maxActive = settings.concurrencyPerAccount;
	const key = keyByUserOrIp(req);
	const active = activeAiGenerations.get(key) ?? 0;

	if (active >= maxActive) {
		const limiterSettings: LimiterSettings = {
			enabled: true,
			max: maxActive,
			windowMs: concurrencyRetryWindowMs,
		};
		monitorOrBlock("ai-generation-concurrency", limiterSettings, req, res, next);
		return;
	}

	activeAiGenerations.set(key, active + 1);

	let released = false;
	const release = () => {
		if (released) return;
		released = true;

		const current = activeAiGenerations.get(key) ?? 0;
		if (current <= 1) {
			activeAiGenerations.delete(key);
		} else {
			activeAiGenerations.set(key, current - 1);
		}
	};

	res.once("finish", release);
	res.once("close", release);
	next();
};

const cleanupExpiredBuckets = (now: number) => {
	for (const [key, bucket] of sessionReviewBuckets.entries()) {
		if (bucket.resetAt <= now) {
			sessionReviewBuckets.delete(key);
		}
	}
};

const getReviewCount = (req: Request): number => {
	const body = req.body as { reviews?: unknown };
	if (!Array.isArray(body.reviews)) return 1;
	return Math.max(body.reviews.length, 1);
};

export const sessionReviewVolumeLimiter: RequestHandler = (req, res, next) => {
	const settings = rateLimitConfig.sessionReviews.reviewHour;
	if (!isLimiterActive(settings, rateLimitConfig.sessionReviews.enabled) || isTrustedRequest(req)) {
		next();
		return;
	}

	const now = Date.now();
	cleanupExpiredBuckets(now);

	const key = keyByUserDeckOrIp(req);
	const reviewCount = getReviewCount(req);
	const existing = sessionReviewBuckets.get(key);
	const bucket =
		existing && existing.resetAt > now
			? existing
			: {
					count: 0,
					resetAt: now + settings.windowMs,
				};

	if (bucket.count + reviewCount > settings.max) {
		monitorOrBlock("study-session-review-events-hour", settings, req, res, next);
		return;
	}

	bucket.count += reviewCount;
	sessionReviewBuckets.set(key, bucket);
	next();
};
