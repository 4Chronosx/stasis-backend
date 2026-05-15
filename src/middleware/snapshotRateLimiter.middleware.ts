import { NextFunction, Request, Response } from "express";

import { RATE_LIMITS } from "../config/rateLimits";

const profile = RATE_LIMITS.http.emotionSnapshotPost;

// key: userId:sessionId -> timestamps of requests within the window
const requestLog = new Map<string, number[]>();

export const snapshotRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
	if (!RATE_LIMITS.enabled || !profile.enabled) {
		next();
		return;
	}

	const userId = req.user?.userId;
	const sessionId = typeof req.params.sessionId === "string" ? req.params.sessionId : "";

	if (!userId) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}

	const key = `${userId}:${sessionId}`;
	const now = Date.now();
	const windowStart = now - profile.windowMs;

	const timestamps = (requestLog.get(key) ?? []).filter((timestamp) => timestamp > windowStart);
	timestamps.push(now);
	requestLog.set(key, timestamps);

	if (timestamps.length > profile.maxRequests) {
		const oldest = timestamps[0] ?? now;
		const retryAfterSeconds = Math.max(1, Math.ceil((oldest + profile.windowMs - now) / 1000));

		res.setHeader("Retry-After", retryAfterSeconds);
		res.status(429).json({ error: profile.message, retryAfterSeconds });
		return;
	}

	next();
};
