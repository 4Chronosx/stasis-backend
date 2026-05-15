import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as emotionService from './emotion.service';
import type { SessionType, SnapshotInput } from './emotion.service';

const VALID_SESSION_TYPES = new Set<SessionType>(['pomodoro', 'study', 'other']);

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  if (typeof value !== 'string') return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const isSnapshotInput = (value: unknown): value is SnapshotInput => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.emotion === 'string' &&
    typeof v.gaze === 'string' &&
    typeof v.confusion === 'boolean' &&
    typeof v.timestamp === 'number'
  );
};

export async function startSession(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const body = req.body as { sessionType?: unknown; metadata?: unknown };

  const sessionType: SessionType = VALID_SESSION_TYPES.has(body.sessionType as SessionType)
    ? (body.sessionType as SessionType)
    : 'pomodoro';

  const metadata =
    body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : undefined;

  const result = await emotionService.startSession(userId, sessionType, metadata);
  res.status(201).json(result);
}

export async function addSnapshots(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { sessionId } = req.params as { sessionId: string };
  const body = req.body as { snapshots?: unknown };

  if (!Array.isArray(body.snapshots) || body.snapshots.length === 0) {
    return res.status(400).json({ error: 'snapshots array is required' });
  }

  const snapshots: SnapshotInput[] = [];
  for (const item of body.snapshots) {
    if (!isSnapshotInput(item)) {
      return res.status(400).json({ error: 'each snapshot needs emotion, gaze, confusion, timestamp' });
    }
    snapshots.push(item);
  }

  const result = await emotionService.addSnapshots(sessionId, userId, snapshots);
  if (!result) return res.status(404).json({ error: 'session not found or already ended' });

  res.json(result);
}

export async function endSession(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { sessionId } = req.params as { sessionId: string };
  const body = req.body as { endedAt?: unknown };

  const endedAt =
    typeof body.endedAt === 'string' && body.endedAt.length > 0
      ? body.endedAt
      : new Date().toISOString();

  const result = await emotionService.endSession(sessionId, userId, endedAt);
  if (!result) return res.status(404).json({ error: 'session not found or already ended' });

  res.json(result);
}

export async function getSession(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { sessionId } = req.params as { sessionId: string };

  const result = await emotionService.getSession(sessionId, userId);
  if (!result) return res.status(404).json({ error: 'session not found' });

  res.json(result);
}

export async function listHistory(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const query = req.query;

  const limit = parsePositiveInt(typeof query.limit === 'string' ? query.limit : undefined, 50);
  const rawOffset = typeof query.offset === 'string' ? parseInt(query.offset, 10) : 0;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  const params: Parameters<typeof emotionService.listHistory>[1] = { limit, offset };
  if (typeof query.startDate === 'string') params.startDate = query.startDate;
  if (typeof query.endDate === 'string') params.endDate = query.endDate;
  if (typeof query.sessionType === 'string') params.sessionType = query.sessionType;

  const result = await emotionService.listHistory(userId, params);

  res.json(result);
}

export async function getTrends(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const query = req.query;

  const validGranularities = ['daily', 'weekly', 'monthly'] as const;
  type Granularity = (typeof validGranularities)[number];
  const granularity: Granularity = validGranularities.includes(query.granularity as Granularity)
    ? (query.granularity as Granularity)
    : 'daily';

  const days = parsePositiveInt(typeof query.days === 'string' ? query.days : undefined, 30);

  const result = await emotionService.getTrends(userId, granularity, days);
  res.json(result);
}

export async function deleteSession(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { sessionId } = req.params as { sessionId: string };

  const deleted = await emotionService.deleteSession(sessionId, userId);
  if (!deleted) return res.status(404).json({ error: 'session not found' });

  res.status(204).send();
}
