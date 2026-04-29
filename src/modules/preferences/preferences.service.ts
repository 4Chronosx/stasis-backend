import { pool } from "../../config/db";
import { CreatePreferencesBody, UpdatePreferencesBody } from "./preferences.schema";

interface PreferencesRow {
  id: string;
  user_id: string;
  attention_score: number;
  adhd_score: number;
  stress_score: number;
  memory_score: number;
  speed_score: number;
  grit_score: number;
  motivation_score: number;
  adaptive_params: Record<string, unknown>;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const PreferencesService = {
  async findByUserId(userId: string): Promise<PreferencesRow | null> {
    const { rows } = await pool.query<PreferencesRow>(
      `SELECT * FROM user_preferences WHERE user_id = $1`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async create(userId: string, data: CreatePreferencesBody): Promise<PreferencesRow | null> {
    const { rows } = await pool.query<PreferencesRow>(
      `INSERT INTO user_preferences (
        user_id, attention_score, adhd_score, stress_score,
        memory_score, speed_score, grit_score, motivation_score,
        adaptive_params, onboarding_completed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        data.attention_score,
        data.adhd_score,
        data.stress_score,
        data.memory_score,
        data.speed_score,
        data.grit_score,
        data.motivation_score,
        JSON.stringify(data.adaptive_params),
        data.onboarding_completed,
      ]
    );
    return rows[0] ?? null;
  },

  async update(userId: string, data: UpdatePreferencesBody): Promise<PreferencesRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const columnMap: Record<string, string> = {
      attention_score: "attention_score",
      adhd_score: "adhd_score",
      stress_score: "stress_score",
      memory_score: "memory_score",
      speed_score: "speed_score",
      grit_score: "grit_score",
      motivation_score: "motivation_score",
      adaptive_params: "adaptive_params",
      onboarding_completed: "onboarding_completed",
    };

    for (const [key, column] of Object.entries(columnMap)) {
      const value = (data as Record<string, unknown>)[key];
      if (value !== undefined) {
        fields.push(`${column} = $${index}`);
        values.push(key === "adaptive_params" ? JSON.stringify(value) : value);
        index++;
      }
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const { rows } = await pool.query<PreferencesRow>(
      `UPDATE user_preferences SET ${fields.join(", ")} WHERE user_id = $${index} RETURNING *`,
      values
    );
    return rows[0] ?? null;
  },

  async deleteByUserId(userId: string): Promise<PreferencesRow | null> {
    const { rows } = await pool.query<PreferencesRow>(
      `DELETE FROM user_preferences WHERE user_id = $1 RETURNING *`,
      [userId]
    );
    return rows[0] ?? null;
  },
};
