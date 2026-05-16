import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export const createRateLimiter = (options: RateLimiterOptions) => {
  const requestLog = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = userId ? `user:${userId}` : `ip:${ip}`;

    const now = Date.now();
    const windowStart = now - options.windowMs;

    const timestamps = (requestLog.get(key) ?? []).filter((t) => t > windowStart);
    timestamps.push(now);
    requestLog.set(key, timestamps);

    if (timestamps.length > options.max) {
      if (req.path.includes('/google/callback')) {
        res.redirect(`${env.CLIENT_URL}/auth/sign-up?error=${encodeURIComponent(options.message || 'Too many requests')}`);
      } else {
        res.status(429).json({ error: options.message || 'Too many requests, please try again later.' });
      }
      return;
    }

    next();
  };
};

export const rateLimiter = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: "Too many login attempts. Please try again after 15 minutes.",
});

export const deckGenerationLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Very strict limit to test if rate limiting works
  message: "Too many deck generation requests. Please try again later.",
});

export const editCardLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: "Too many card edits. Please slow down.",
});
