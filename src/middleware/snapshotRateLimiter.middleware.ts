import { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 10_000;
const MAX_REQUESTS = 5;

// key: userId:sessionId → timestamps of requests within the window
const requestLog = new Map<string, number[]>();

export const snapshotRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const userId = (req as Request & { user?: { userId: string } }).user?.userId;
  const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const key = `${userId}:${sessionId}`;
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = (requestLog.get(key) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  requestLog.set(key, timestamps);

  if (timestamps.length > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many snapshot submissions. Slow down batch frequency.' });
    return;
  }

  next();
};
