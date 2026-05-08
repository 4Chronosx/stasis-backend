
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

export async function addCard(deckId: number, front: string, back: string) {
  const fsrsCard = createEmptyCard();

  const { rows } = await db.query<CardRow>(
    `INSERT INTO cards (
      deck_id, front, back,
      due, stability, difficulty, scheduled_days,
      reps, lapses, state, last_review
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7,
      $8, $9,
      $10, $11
    ) RETURNING *`,
    [
      deckId, front, back,
      fsrsCard.due, fsrsCard.stability, fsrsCard.difficulty, fsrsCard.scheduled_days,
      fsrsCard.reps, fsrsCard.lapses, fsrsCard.state, fsrsCard.last_review ?? null,
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

export async function listCards(deckId: number) {
  const { rows } = await db.query<CardRow>(
    `SELECT * FROM cards WHERE deck_id = $1 ORDER BY due ASC`,
    [deckId]
  );
  return rows;
}

export async function getCard(id: number) {
  const { rows } = await db.query<CardRow>(`SELECT * FROM cards WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function updateCard(id: number, front: string, back: string) {
  const { rows } = await db.query<CardRow>(
    `UPDATE cards SET front = $1, back = $2 WHERE id = $3 RETURNING *`,
    [front, back, id]
  );
  return rows[0] ?? null;
}

export async function deleteCard(id: number) {
  await db.query(`DELETE FROM cards WHERE id = $1`, [id]);
}