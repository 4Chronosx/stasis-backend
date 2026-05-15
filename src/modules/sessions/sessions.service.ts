import { db } from '../../config/db';
import { scheduler } from '../../config/scheduler';
import { Rating, type Card, type ReviewLog } from 'ts-fsrs';
import type { Review } from './sessions.schema';
import { incrementCompletedCards } from '../streaks/streaks.service';

type CardRow = {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  due: string | Date;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | Date | null;
};

type CardUpdate = Card & { id: number };
type ReviewLogEntry = ReviewLog & { cardId: number };

const toDate = (value: string | Date): Date => (value instanceof Date ? value : new Date(value));

const toFsrsCard = (row: CardRow): Card => {
  const lastReview = row.last_review ? toDate(row.last_review) : undefined

  return {
    due: toDate(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: 0,
    scheduled_days: row.scheduled_days,
    learning_steps: 0,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    ...(lastReview ? { last_review: lastReview } : {}),
  }
}

export async function loadSession(deckId: number, userId: string) {
  const { rows } = await db.query<CardRow>(
    `SELECT c.* FROM cards c
     JOIN decks d ON d.id = c.deck_id
     WHERE c.deck_id = $1
       AND d.user_id = $2
       AND c.due <= NOW()
     ORDER BY c.due ASC`,
    [deckId, userId]
  )

  const now = new Date()

  return rows.map(row => {
    const card = toFsrsCard(row)

    const preview = scheduler.repeat(card, now)

    return {
      id: row.id,
      front: row.front,
      back: row.back,
      state: row.state,
      intervals: {
        again: preview[Rating.Again].card.due,
        hard:  preview[Rating.Hard].card.due,
        good:  preview[Rating.Good].card.due,
        easy:  preview[Rating.Easy].card.due,
      }
    }
  })
}

export async function submitSession(reviews: Review[], profileId: string, deckId: number) {
  const cardIds = reviews.map(r => r.cardId)
  const { rows } = await db.query<CardRow>(
    `SELECT c.* FROM cards c
     JOIN decks d ON d.id = c.deck_id
     WHERE c.id = ANY($1)
       AND c.deck_id = $2
       AND d.user_id = $3`,
    [cardIds, deckId, profileId]
  )

  const cardMap = new Map<number, Card>(rows.map(row => [row.id, toFsrsCard(row)]))

  const updates: CardUpdate[] = []
  const logs: ReviewLogEntry[] = []

  for (const review of reviews) {
    const card = cardMap.get(review.cardId)
    if (!card) continue

    const now = new Date(review.reviewedAt)
    const result = scheduler.next(card, now, review.rating)

    updates.push({ ...result.card, id: review.cardId })
    logs.push({ ...result.log, cardId: review.cardId })

    // update in-memory card in case the same card appears multiple times
    // (e.g. rated Again then Good in the same session)
    cardMap.set(review.cardId, result.card)
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN')

    for (const card of updates) {
      await client.query(
        `UPDATE cards SET
        due = $1, stability = $2, difficulty = $3,
        scheduled_days = $4,
        reps = $5, lapses = $6, state = $7, last_review = $8
        WHERE id = $9 AND deck_id = $10`,
        [
          card.due, card.stability, card.difficulty,
          card.scheduled_days,
          card.reps, card.lapses, card.state, card.last_review ?? null,
          card.id,
          deckId
        ]
      )
    }

    for (const log of logs) {
      await client.query(
        `INSERT INTO review_logs (
        card_id, rating, state, due, review,
        stability, difficulty, scheduled_days, last_elapsed_days
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          log.cardId,
          log.rating, log.state, log.due, log.review,
          log.stability, log.difficulty,
          log.scheduled_days, log.last_elapsed_days
        ]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  if (updates.length > 0) {
    await incrementCompletedCards(profileId, updates.length);
  }
  return { saved: updates.length }
}
