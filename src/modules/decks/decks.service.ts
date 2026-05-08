

import { db } from "../../config/db";

type DeckRow = {
  id: number;
  topic_id: string;
  name: string;
  description: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

export async function createDeck(name: string) {
  const { rows } = await db.query<DeckRow>(
    `INSERT INTO decks (name) VALUES ($1) RETURNING *`,
    [name]
  )
  return rows[0] ?? null
}

export async function listDecks() {
  const { rows } = await db.query<DeckRow>(`SELECT * FROM decks ORDER BY created_at DESC`)
  return rows
}

export async function getDeck(id: number) {
  const { rows } = await db.query<DeckRow>(`SELECT * FROM decks WHERE id = $1`, [id])
  return rows[0] ?? null
}

export async function deleteDeck(id: number) {
  await db.query(`DELETE FROM decks WHERE id = $1`, [id])
}