import { db } from "../../config/db";
import {
  CreatePreferencesBody,
  DEFAULT_RUNTIME_PREFERENCES,
  RuntimePreferences,
  UpdatePreferencesBody,
  runtimePreferencesSchema,
} from "./preferences.schema";

type PreferencesRow = {
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
  privacy_comfort: string | null;
  expression_tolerance: string | null;
  study_block_length: number | null;
  mini_breaks_per_session: number | null;
  recovery_duration: number | null;
  break_mechanic: string | null;
  show_timer: boolean | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;

  created_at: string;
  updated_at: string;
};

interface RuntimePreferencesRow {
  privacy_comfort: unknown;
  expression_tolerance: unknown;
  study_block_length: unknown;
  mini_breaks_per_session: unknown;
  recovery_duration: unknown;
  break_mechanic: unknown;
  show_timer: unknown;
  onboarding_completed_at: string | null;
  updated_at: string;
}

export interface RuntimePreferencesResponse {
  preferences: RuntimePreferences;
  onboarding_snapshot: RuntimePreferences | null;
  updated_at: string | null;
  storage_available: boolean;
}

const MISSING_RUNTIME_SCHEMA_CODES = new Set(["42703", "42P01"]);

const RUNTIME_PREFERENCE_COLUMNS = `
  privacy_comfort,
  expression_tolerance,
  study_block_length,
  mini_breaks_per_session,
  recovery_duration,
  break_mechanic,
  show_timer,
  onboarding_completed_at,
  updated_at
`;

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
    candidate.break_mechanic = "relaxed";
  }

  const result = runtimePreferencesSchema.safeParse(candidate);
  return result.success ? result.data : DEFAULT_RUNTIME_PREFERENCES;
}

function runtimePreferencesFromRow(
  row: RuntimePreferencesRow | null
): RuntimePreferences {
  if (!row) {
    return DEFAULT_RUNTIME_PREFERENCES;
  }

  return normalizeRuntimePreferences({
    privacy_comfort: row.privacy_comfort,
    expression_tolerance: row.expression_tolerance,
    study_block_length: row.study_block_length,
    mini_breaks_per_session: row.mini_breaks_per_session,
    recovery_duration: row.recovery_duration,
    break_mechanic: row.break_mechanic,
    show_timer: row.show_timer,
  });
}

function toRuntimeResponse(
  row: RuntimePreferencesRow | null
): RuntimePreferencesResponse {
  if (!row) {
    return {
      preferences: DEFAULT_RUNTIME_PREFERENCES,
      onboarding_snapshot: null,
      updated_at: null,
      storage_available: true,
    };
  }

  return {
    preferences: runtimePreferencesFromRow(row),
    onboarding_snapshot: null,
    updated_at: row.updated_at,
    storage_available: true,
  };
}

function runtimePreferenceValues(preferences: RuntimePreferences) {
  return [
    preferences.privacy_comfort,
    preferences.expression_tolerance,
    preferences.study_block_length,
    preferences.mini_breaks_per_session,
    preferences.recovery_duration,
    preferences.break_mechanic,
    preferences.show_timer,
  ];
}

export const PreferencesService = {
  async findByUserId(userId: string): Promise<PreferencesRow | null> {
    const { rows } = await db.query<PreferencesRow>(
      `SELECT * FROM user_preferences WHERE user_id = $1`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async findRuntimeByUserId(
    userId: string
  ): Promise<RuntimePreferencesResponse> {
    try {
      const { rows } = await db.query<RuntimePreferencesRow>(
        `SELECT ${RUNTIME_PREFERENCE_COLUMNS}
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
    try {
      const { rows } = await db.query<RuntimePreferencesRow>(
        `INSERT INTO user_preferences (
           user_id,
           privacy_comfort,
           expression_tolerance,
           study_block_length,
           mini_breaks_per_session,
           recovery_duration,
           break_mechanic,
           show_timer
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id)
         DO UPDATE SET
           privacy_comfort = EXCLUDED.privacy_comfort,
           expression_tolerance = EXCLUDED.expression_tolerance,
           study_block_length = EXCLUDED.study_block_length,
           mini_breaks_per_session = EXCLUDED.mini_breaks_per_session,
           recovery_duration = EXCLUDED.recovery_duration,
           break_mechanic = EXCLUDED.break_mechanic,
           show_timer = EXCLUDED.show_timer,
           updated_at = NOW()
         RETURNING ${RUNTIME_PREFERENCE_COLUMNS}`,
        [userId, ...runtimePreferenceValues(preferences)]
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
    try {
      const { rows } = await db.query<RuntimePreferencesRow>(
        `INSERT INTO user_preferences (
           user_id,
           privacy_comfort,
           expression_tolerance,
           study_block_length,
           mini_breaks_per_session,
           recovery_duration,
           break_mechanic,
           show_timer,
           onboarding_completed,
           onboarding_completed_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           privacy_comfort = EXCLUDED.privacy_comfort,
           expression_tolerance = EXCLUDED.expression_tolerance,
           study_block_length = EXCLUDED.study_block_length,
           mini_breaks_per_session = EXCLUDED.mini_breaks_per_session,
           recovery_duration = EXCLUDED.recovery_duration,
           break_mechanic = EXCLUDED.break_mechanic,
           show_timer = EXCLUDED.show_timer,
           onboarding_completed = TRUE,
           onboarding_completed_at = COALESCE(
             user_preferences.onboarding_completed_at,
             EXCLUDED.onboarding_completed_at
           ),
           updated_at = NOW()
         RETURNING ${RUNTIME_PREFERENCE_COLUMNS}`,
        [userId, ...runtimePreferenceValues(preferences)]
      );

      return toRuntimeResponse(rows[0] ?? null);
    } catch (error) {
      if (!isMissingRuntimeSchemaError(error)) {
        throw error;
      }

      throw new RuntimePreferencesStorageUnavailableError();
    }
  },

  async create(
    userId: string,
    data: CreatePreferencesBody
  ): Promise<PreferencesRow | null> {
    const { rows } = await db.query<PreferencesRow>(
      `INSERT INTO user_preferences (
        user_id, attention_score, adhd_score, stress_score,
        memory_score, speed_score, grit_score, motivation_score,
        adaptive_params, onboarding_completed, privacy_comfort,
        expression_tolerance, study_block_length, mini_breaks_per_session,
        recovery_duration, break_mechanic, show_timer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
        data.privacy_comfort ?? null,
        data.expression_tolerance ?? null,
        data.study_block_length ?? null,
        data.mini_breaks_per_session ?? null,
        data.recovery_duration ?? null,
        data.break_mechanic ?? null,
        data.show_timer ?? true,
      ]
    );
    return rows[0] ?? null;
  },

  async ensureForUser(userId: string): Promise<PreferencesRow | null> {
    const { rows } = await db.query<PreferencesRow>(
      `INSERT INTO user_preferences (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
      RETURNING *`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async getCompletionStatus(userId: string): Promise<boolean> {
    const { rows } = await db.query<Pick<PreferencesRow, "onboarding_completed">>(
      `SELECT onboarding_completed FROM user_preferences WHERE user_id = $1`,
      [userId]
    );
    return rows[0]?.onboarding_completed ?? false;
  },

  async markOnboardingCompleted(userId: string): Promise<PreferencesRow | null> {
    const preferences = await this.ensureForUser(userId);

    if (!preferences) {
      return null;
    }

    const { rows } = await db.query<PreferencesRow>(
      `UPDATE user_preferences
      SET onboarding_completed = TRUE, updated_at = NOW()
      WHERE user_id = $1
      RETURNING *`,
      [userId]
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
      privacy_comfort: "privacy_comfort",
      expression_tolerance: "expression_tolerance",
      study_block_length: "study_block_length",
      mini_breaks_per_session: "mini_breaks_per_session",
      recovery_duration: "recovery_duration",
      break_mechanic: "break_mechanic",
      show_timer: "show_timer",
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
