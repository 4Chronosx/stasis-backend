import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as emotionService from './emotion.service';
import type {
  AddSnapshotsBody,
  EmotionSessionParams,
  EndSessionBody,
  ListHistoryQuery,
  StartSessionBody,
  TrendsQuery,
} from './emotion.schema';

export async function startSession(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const body = req.body as StartSessionBody;

  const result = await emotionService.startSession(
    userId,
    body.sessionType,
    body.metadata,
  );
  res.status(201).json(result);
}

export async function addSnapshots(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { sessionId } = req.params as EmotionSessionParams;
  const body = req.body as AddSnapshotsBody;

  const result = await emotionService.addSnapshots(sessionId, userId, body.snapshots);
  if (!result) return res.status(404).json({ error: 'session not found or already ended' });

  res.json(result);
}

export async function endSession(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { sessionId } = req.params as EmotionSessionParams;
  const body = req.body as EndSessionBody | undefined;

  const endedAt = body?.endedAt ?? new Date().toISOString();

  const result = await emotionService.endSession(sessionId, userId, endedAt);
  if (!result) return res.status(404).json({ error: 'session not found or already ended' });

  res.json(result);
}

export async function getSession(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { sessionId } = req.params as EmotionSessionParams;

  const result = await emotionService.getSession(sessionId, userId);
  if (!result) return res.status(404).json({ error: 'session not found' });

  res.json(result);
}

export async function listHistory(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const query = req.query as ListHistoryQuery;

  const params: Parameters<typeof emotionService.listHistory>[1] = {
    limit: query.limit,
    offset: query.offset,
  };
  if (query.startDate) params.startDate = query.startDate;
  if (query.endDate) params.endDate = query.endDate;
  if (query.sessionType) params.sessionType = query.sessionType;

  const result = await emotionService.listHistory(userId, params);

  res.json(result);
}

export async function getTrends(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const query = req.query as TrendsQuery;

  const result = await emotionService.getTrends(userId, query.granularity, query.days);
  res.json(result);
}

export async function deleteSession(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { sessionId } = req.params as EmotionSessionParams;

  const deleted = await emotionService.deleteSession(sessionId, userId);
  if (!deleted) return res.status(404).json({ error: 'session not found' });

  res.status(204).send();
}
