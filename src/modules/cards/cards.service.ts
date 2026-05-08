
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