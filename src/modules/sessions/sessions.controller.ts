import { Request, Response } from 'express'
import * as sessionsService from './sessions.service'
import type { Review } from './sessions.service'
import type { Grade } from 'ts-fsrs'

const parseIdParam = (value: unknown): number | null => {
  const raw = typeof value === 'string' || typeof value === 'number' ? Number(value) : Number.NaN
  return Number.isFinite(raw) ? raw : null
}

const parseRating = (value: unknown): Grade | null => {
  const normalized = typeof value === 'string' ? Number(value) : value
  if (normalized === 1 || normalized === 2 || normalized === 3 || normalized === 4) {
    return normalized
  }
  return null
}

const parseReview = (value: unknown): Review | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>

  if (record.cardId === undefined || record.cardId === null) return null
  if (record.rating === undefined || record.rating === null) return null
  if (typeof record.reviewedAt !== 'string' || record.reviewedAt.trim().length === 0) return null

  const cardId = parseIdParam(record.cardId)
  if (cardId === null) return null

  const rating = parseRating(record.rating)
  if (rating === null) return null

  return {
    cardId,
    rating,
    reviewedAt: record.reviewedAt,
  }
}

export async function loadSession(req: Request, res: Response) {
  const params = req.params as { deckId?: string }
  const deckId = parseIdParam(params.deckId)
  if (deckId === null) return res.status(400).json({ error: 'invalid deckId' });

  const cards = await sessionsService.loadSession(deckId);
  res.json({ cards })
}

export async function submitSession(req: Request, res: Response) {
  const body = req.body as { reviews?: unknown }
  if (!Array.isArray(body.reviews) || body.reviews.length === 0) {
    return res.status(400).json({ error: 'reviews array is required' });
  }

  const reviews: Review[] = []
  for (const entry of body.reviews) {
    if (!entry || typeof entry !== 'object') {
      return res.status(400).json({ error: 'each review needs cardId, rating, reviewedAt' });
    }

    const record = entry as Record<string, unknown>
    if (record.rating !== undefined && record.rating !== null) {
      const rating = parseRating(record.rating)
      if (rating === null) {
        return res.status(400).json({ error: 'invalid rating ' + JSON.stringify(record.rating) + ', must be 1-4' });
      }
    }

    const parsed = parseReview(record)
    if (!parsed) {
      return res.status(400).json({ error: 'each review needs cardId, rating, reviewedAt' });
    }

    reviews.push(parsed)
  }

  const result = await sessionsService.submitSession(reviews);
  res.json(result);
}
