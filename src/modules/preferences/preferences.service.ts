import { db } from "../../config/db";
import {
  CreatePreferencesBody,
  DEFAULT_RUNTIME_PREFERENCES,
  RuntimePreferences,
  UpdatePreferencesBody,
  runtimePreferencesSchema,
} from "./preferences.schema";

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
  runtime_preferences: RuntimePreferences | null;
  onboarding_snapshot: RuntimePreferences | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface RuntimePreferencesRow {
  runtime_preferences: unknown;
  onboarding_snapshot: unknown;
  updated_at: string;
}

export interface RuntimePreferencesResponse {
  preferences: RuntimePreferences;
  onboarding_snapshot: RuntimePreferences | null;
  updated_at: string | null;
  storage_available: boolean;
}

const MISSING_RUNTIME_SCHEMA_CODES = new Set(["42703", "42P01"]);

export class RuntimePreferencesStorageUnavailableError extends Error {
  constructor() {
    super("Runtime preferences storage is not available until migrations run.");
    this.name = "RuntimePreferencesStorageUnavailableError";
  }
}

function isMissingRuntimeSchemaError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    MISSING_RUNTIME_SCHEMA_CODES.has(error.code)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRuntimePreferences(value: unknown): RuntimePreferences {
  const candidate: Record<string, unknown> = {
    ...DEFAULT_RUNTIME_PREFERENCES,
    ...(isRecord(value) ? value : {}),
  };

  if (candidate.privacy_comfort === "off") {
    candidate.emotion_detection = false;
    candidate.break_mechanic = "relaxed";
  }

  const result = runtimePreferencesSchema.safeParse(candidate);
  return result.success ? result.data : DEFAULT_RUNTIME_PREFERENCES;
}

function toRuntimeResponse(row: RuntimePreferencesRow | null): RuntimePreferencesResponse {
  if (!row) {
    return {
      preferences: DEFAULT_RUNTIME_PREFERENCES,
      onboarding_snapshot: null,
      updated_at: null,
      storage_available: true,
    };
  }

  return {
    preferences: normalizeRuntimePreferences(row.runtime_preferences),
    onboarding_snapshot: row.onboarding_snapshot
      ? normalizeRuntimePreferences(row.onboarding_snapshot)
      : null,
    updated_at: row.updated_at,
    storage_available: true,
  };
}

export const PreferencesService = {
  async findByUserId(userId: string): Promise<PreferencesRow | null> {
    const { rows } = await db.query<PreferencesRow>(
      `SELECT * FROM user_preferences WHERE user_id = $1`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async findRuntimeByUserId(userId: string): Promise<RuntimePreferencesResponse> {
    try {
      const { rows } = await db.query<RuntimePreferencesRow>(
        `SELECT runtime_preferences, onboarding_snapshot, updated_at
         FROM user_preferences
         WHERE user_id = $1`,
        [userId]
      );

      return toRuntimeResponse(rows[0] ?? null);
    } catch (error) {
      if (!isMissingRuntimeSchemaError(error)) {
        throw error;
      }

      return {
        preferences: DEFAULT_RUNTIME_PREFERENCES,
        onboarding_snapshot: null,
        updated_at: null,
        storage_available: false,
      };
    }
  },

  async saveRuntime(
    userId: string,
    preferences: RuntimePreferences
  ): Promise<RuntimePreferencesResponse> {
    const payload = JSON.stringify(preferences);

    try {
      const { rows } = await db.query<RuntimePreferencesRow>(
        `INSERT INTO user_preferences (user_id, runtime_preferences)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE SET
           runtime_preferences = EXCLUDED.runtime_preferences,
           updated_at = NOW()
         RETURNING runtime_preferences, onboarding_snapshot, updated_at`,
        [userId, payload]
      );

      return toRuntimeResponse(rows[0] ?? null);
    } catch (error) {
      if (!isMissingRuntimeSchemaError(error)) {
        throw error;
      }

      throw new RuntimePreferencesStorageUnavailableError();
    }
  },

  async completeOnboarding(
    userId: string,
    preferences: RuntimePreferences
  ): Promise<RuntimePreferencesResponse> {
    const payload = JSON.stringify(preferences);

    try {
      const { rows } = await db.query<RuntimePreferencesRow>(
        `INSERT INTO user_preferences (
           user_id,
           runtime_preferences,
           onboarding_snapshot,
           onboarding_completed
         )
         VALUES ($1, $2, $2, TRUE)
         ON CONFLICT (user_id)
         DO UPDATE SET
           runtime_preferences = EXCLUDED.runtime_preferences,
           onboarding_snapshot = COALESCE(
             user_preferences.onboarding_snapshot,
             EXCLUDED.onboarding_snapshot
           ),
           onboarding_completed = TRUE,
           updated_at = NOW()
         RETURNING runtime_preferences, onboarding_snapshot, updated_at`,
        [userId, payload]
      );

      return toRuntimeResponse(rows[0] ?? null);
    } catch (error) {
      if (!isMissingRuntimeSchemaError(error)) {
        throw error;
      }

      throw new RuntimePreferencesStorageUnavailableError();
    }
  },

  async create(userId: string, data: CreatePreferencesBody): Promise<PreferencesRow | null> {
    const { rows } = await db.query<PreferencesRow>(
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

    const { rows } = await db.query<PreferencesRow>(
      `UPDATE user_preferences SET ${fields.join(", ")} WHERE user_id = $${index} RETURNING *`,
      values
    );
    return rows[0] ?? null;
  },

  async deleteByUserId(userId: string): Promise<PreferencesRow | null> {
    const { rows } = await db.query<PreferencesRow>(
      `DELETE FROM user_preferences WHERE user_id = $1 RETURNING *`,
      [userId]
    );
    return rows[0] ?? null;
  },
};
