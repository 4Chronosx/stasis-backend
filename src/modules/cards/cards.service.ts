
import { db } from '../../config/db';
import { createEmptyCard } from 'ts-fsrs';

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

export async function addCard(deckId: number, userId: string, front: string, back: string) {
  const fsrsCard = createEmptyCard();

  const { rows } = await db.query<CardRow>(
    `INSERT INTO cards (
      deck_id, front, back,
      due, stability, difficulty, scheduled_days,
      reps, lapses, state, last_review
    ) SELECT
      $1, $2, $3, $4,
      $5, $6, $7,
      $8, $9,
      $10, $11
    WHERE EXISTS (
      SELECT 1 FROM decks WHERE id = $1 AND user_id = $12
    )
    RETURNING *`,
    [
      deckId, front, back,
      fsrsCard.due, fsrsCard.stability, fsrsCard.difficulty, fsrsCard.scheduled_days,
      fsrsCard.reps, fsrsCard.lapses, fsrsCard.state, fsrsCard.last_review ?? null,
      userId,
    ]
  );
  return rows[0] ?? null;
}

export async function addCards(deckId: number, cards: { question: string; answer: string }[]) {
  if (cards.length === 0) return [];

  const fsrsCard = createEmptyCard();

  // Build a single INSERT with multiple value rows
  const values: unknown[] = [];
  const placeholders: string[] = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const offset = i * 11;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`
    );
    values.push(
      deckId,
      card!.question,
      card!.answer,
      fsrsCard.due,
      fsrsCard.stability,
      fsrsCard.difficulty,
      fsrsCard.scheduled_days,
      fsrsCard.reps,
      fsrsCard.lapses,
      fsrsCard.state,
      fsrsCard.last_review ?? null,
    );
  }

  const { rows } = await db.query<CardRow>(
    `INSERT INTO cards (
      deck_id, front, back,
      due, stability, difficulty, scheduled_days,
      reps, lapses, state, last_review
    ) VALUES ${placeholders.join(", ")} RETURNING *`,
    values,
  );

  return rows;
}

export async function listCards(deckId: number, userId: string) {
  const { rows } = await db.query<CardRow>(
    `SELECT c.* FROM cards c
     JOIN decks d ON d.id = c.deck_id
     WHERE c.deck_id = $1 AND d.user_id = $2
     ORDER BY c.due ASC`,
    [deckId, userId]
  );
  return rows;
}

export async function getCard(id: number, deckId: number, userId: string) {
  const { rows } = await db.query<CardRow>(
    `SELECT c.* FROM cards c
     JOIN decks d ON d.id = c.deck_id
     WHERE c.id = $1 AND c.deck_id = $2 AND d.user_id = $3`,
    [id, deckId, userId]
  );
  return rows[0] ?? null;
}

export async function updateCard(
  id: number,
  deckId: number,
  userId: string,
  front?: string,
  back?: string,
) {
  const { rows } = await db.query<CardRow>(
    `UPDATE cards c
     SET front = COALESCE($4::text, c.front),
         back = COALESCE($5::text, c.back)
     FROM decks d
     WHERE c.id = $1
       AND c.deck_id = $2
       AND d.id = c.deck_id
       AND d.user_id = $3
     RETURNING c.*`,
    [id, deckId, userId, front ?? null, back ?? null]
  );
  return rows[0] ?? null;
}

export async function deleteCard(id: number, deckId: number, userId: string) {
  const { rowCount } = await db.query(
    `DELETE FROM cards c
     USING decks d
     WHERE c.id = $1
       AND c.deck_id = $2
       AND d.id = c.deck_id
       AND d.user_id = $3`,
    [id, deckId, userId]
  );
  return rowCount != null && rowCount > 0;
}
