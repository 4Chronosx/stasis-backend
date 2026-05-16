
import { db } from "../../config/db";
import { generateDeck } from "./deckGenerator";
import { addCards } from "../cards/cards.service";

type DeckRow = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

/**
 * Creates a deck from an uploaded PDF:
 * 1. Sends the PDF to Gemini to generate name, description, and flashcards
 * 2. Inserts the deck row into the database
 * 3. Bulk-inserts all generated cards
 * 4. Returns the deck + cards
 */
export async function createDeck(
  pdfBuffer: Buffer,
  cardCount: number,
  userId: string,
  name?: string,
  description?: string,
) {
  const generated = await generateDeck(pdfBuffer, cardCount, name, description);

  const { rows } = await db.query<DeckRow>(
    `INSERT INTO decks (name, description, user_id) VALUES ($1, $2, $3) RETURNING *`,
    [generated.name, generated.description, userId],
  );
  const deck = rows[0];
  if (!deck) {
    throw new Error("Failed to insert deck row");
  }

  const cards = await addCards(deck.id, generated.cards);

  return { deck, cards };
}

export async function listDecks(userId: string) {
  const { rows } = await db.query<DeckRow>(
    `SELECT * FROM decks WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}

export async function getDeck(id: number, userId: string) {
  const { rows } = await db.query<DeckRow>(
    `SELECT * FROM decks WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows[0] ?? null;
}

export async function deleteDeck(id: number) {
  await db.query(`DELETE FROM decks WHERE id = $1`, [id]);
}

export async function updateDeck(
  id: number,
  name: string,
  description: string,
) {
  const { rows } = await db.query<DeckRow>(
    `UPDATE decks SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [name, description, id],
  );
  return rows[0] ?? null;
}