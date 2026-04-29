import { pool } from "../../config/db";
import { CreateFlashcardBody, UpdateFlashcardBody } from "./flashcards.schema";

interface FlashcardRow {
  id: number;
  deck_id: number;
  name: string;
  description: string | null;
  question: string;
  answer: string;
  created_at: string;
}

export const FlashcardsService = {
  async findById(id: number): Promise<FlashcardRow | null> {
    const { rows } = await pool.query<FlashcardRow>(
      `SELECT * FROM flash_cards WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async findByDeckId(deckId: number): Promise<FlashcardRow[]> {
    const { rows } = await pool.query<FlashcardRow>(
      `SELECT * FROM flash_cards WHERE deck_id = $1 ORDER BY id ASC`,
      [deckId]
    );
    return rows;
  },

  async create(data: CreateFlashcardBody): Promise<FlashcardRow | null> {
    const { rows } = await pool.query<FlashcardRow>(
      `INSERT INTO flash_cards (deck_id, name, description, question, answer)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.deck_id,
        data.name,
        data.description ?? null,
        data.question,
        data.answer,
      ]
    );
    return rows[0] ?? null;
  },

  async update(id: number, data: UpdateFlashcardBody): Promise<FlashcardRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const columnMap: Record<string, string> = {
      deck_id: "deck_id",
      name: "name",
      description: "description",
      question: "question",
      answer: "answer",
    };

    for (const [key, column] of Object.entries(columnMap)) {
      const value = (data as Record<string, unknown>)[key];
      if (value !== undefined) {
        fields.push(`${column} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const { rows } = await pool.query<FlashcardRow>(
      `UPDATE flash_cards SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`,
      values
    );
    return rows[0] ?? null;
  },

  async deleteById(id: number): Promise<FlashcardRow | null> {
    const { rows } = await pool.query<FlashcardRow>(
      `DELETE FROM flash_cards WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0] ?? null;
  },
};
