
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
  name?: string,
) {
  // 1. Generate deck content from the PDF via Gemini
  const generated = await generateDeck(pdfBuffer, cardCount, name);

  // 2. Insert the deck row
  const { rows } = await db.query<DeckRow>(
    `INSERT INTO decks (name, description) VALUES ($1, $2) RETURNING *`,
    [generated.name, generated.description],
  );
  const deck = rows[0];
  if (!deck) {
    throw new Error("Failed to insert deck row");
  }

  // 3. Bulk-insert the generated cards
  const cards = await addCards(deck.id, generated.cards);

  return { deck, cards };
}

export async function listDecks() {
  const { rows } = await db.query<DeckRow>(`SELECT * FROM decks ORDER BY created_at DESC`);
  return rows;
}

export async function getDeck(id: number) {
  const { rows } = await db.query<DeckRow>(`SELECT * FROM decks WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function deleteDeck(id: number) {
  await db.query(`DELETE FROM decks WHERE id = $1`, [id]);
}