import { db } from '../../config/db';

export type SessionType = 'pomodoro' | 'study' | 'other';

export type EmotionLabel = string;
export type GazeLabel = string;

export interface SnapshotInput {
  emotion: EmotionLabel;
  gaze: GazeLabel;
  confusion: boolean;
  timestamp: number;
  confidence?: number;
}

type SessionRow = {
  id: string;
  user_id: string;
  session_type: string;
  started_at: Date;
  ended_at: Date | null;
  snapshot_count: number;
  focus_score: string | null;
  emotion_breakdown: Record<string, number> | null;
  metadata: Record<string, unknown> | null;
};

type SnapshotRow = {
  id: string;
  session_id: string;
  emotion: string;
  gaze: string;
  confusion: boolean;
  client_ts: string;
  confidence: string | null;
};

const VALID_EMOTIONS = new Set(['focused', 'distracted', 'tired', 'confused', 'neutral']);
const VALID_GAZES = new Set(['center', 'left', 'right', 'up', 'down', 'away']);

const normalizeEmotion = (e: string): string =>
  VALID_EMOTIONS.has(e) ? e : 'neutral';

const normalizeGaze = (g: string): string =>
  VALID_GAZES.has(g) ? g : 'center';

function computeAnalysis(snapshots: SnapshotRow[]) {
  if (snapshots.length === 0) {
    return { focusScore: 0, confusionRate: 0, emotionBreakdown: {} };
  }

  const counts: Record<string, number> = {};
  let confusionCount = 0;

  for (const s of snapshots) {
    counts[s.emotion] = (counts[s.emotion] ?? 0) + 1;
    if (s.confusion) confusionCount++;
  }

  const total = snapshots.length;
  const emotionBreakdown: Record<string, number> = {};
  for (const [emotion, count] of Object.entries(counts)) {
    emotionBreakdown[emotion] = Math.round((count / total) * 1000) / 1000;
  }

  const focusScore = Math.round(((counts['focused'] ?? 0) + (counts['neutral'] ?? 0)) / total * 1000) / 1000;
  const confusionRate = Math.round((confusionCount / total) * 1000) / 1000;

  return { focusScore, confusionRate, emotionBreakdown };
}

export async function startSession(
  userId: string,
  sessionType: SessionType,
  metadata?: Record<string, unknown>,
) {
  const { rows } = await db.query<SessionRow>(
    `INSERT INTO emotion_sessions (user_id, session_type, metadata)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, sessionType, metadata ? JSON.stringify(metadata) : null],
  );
  const row = rows[0]!;
  return { sessionId: row.id, startedAt: row.started_at, status: 'recording' as const };
}

export async function addSnapshots(
  sessionId: string,
  userId: string,
  snapshots: SnapshotInput[],
) {
  const { rows: sessionRows } = await db.query<{ id: string }>(
    `SELECT id FROM emotion_sessions WHERE id = $1 AND user_id = $2 AND ended_at IS NULL`,
    [sessionId, userId],
  );
  if (sessionRows.length === 0) return null;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    for (const s of snapshots) {
      await client.query(
        `INSERT INTO emotion_snapshots (session_id, emotion, gaze, confusion, client_ts, confidence)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          sessionId,
          normalizeEmotion(s.emotion),
          normalizeGaze(s.gaze),
          s.confusion,
          s.timestamp,
          s.confidence ?? null,
        ],
      );
    }

    await client.query(
      `UPDATE emotion_sessions SET snapshot_count = snapshot_count + $1 WHERE id = $2`,
      [snapshots.length, sessionId],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { received: snapshots.length, processed: snapshots.length, status: 'ok' as const };
}

export async function endSession(
  sessionId: string,
  userId: string,
  endedAt: string,
) {
  const { rows: sessionRows } = await db.query<{ id: string }>(
    `SELECT id FROM emotion_sessions WHERE id = $1 AND user_id = $2 AND ended_at IS NULL`,
    [sessionId, userId],
  );
  if (sessionRows.length === 0) return null;

  const { rows: snapshots } = await db.query<SnapshotRow>(
    `SELECT * FROM emotion_snapshots WHERE session_id = $1 ORDER BY client_ts`,
    [sessionId],
  );

  const analysis = computeAnalysis(snapshots);

  const { rows } = await db.query<SessionRow>(
    `UPDATE emotion_sessions
     SET ended_at = $1, focus_score = $2, emotion_breakdown = $3
     WHERE id = $4
     RETURNING *`,
    [endedAt, analysis.focusScore, JSON.stringify(analysis.emotionBreakdown), sessionId],
  );

  const row = rows[0]!;
  const durationMs = new Date(endedAt).getTime() - row.started_at.getTime();
  const durationMin = Math.round(durationMs / 60000);

  return {
    sessionId: row.id,
    duration: `${durationMin}m`,
    snapshotCount: row.snapshot_count,
    analysis: {
      focusScore: analysis.focusScore,
      confusionRate: analysis.confusionRate,
      emotionBreakdown: analysis.emotionBreakdown,
    },
  };
}

export async function getSession(sessionId: string, userId: string) {
  const { rows: sessionRows } = await db.query<SessionRow>(
    `SELECT * FROM emotion_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId],
  );
  if (sessionRows.length === 0) return null;

  const row = sessionRows[0]!;
  const { rows: snapshots } = await db.query<SnapshotRow>(
    `SELECT * FROM emotion_snapshots WHERE session_id = $1 ORDER BY client_ts`,
    [sessionId],
  );

  const analysis = row.ended_at
    ? {
        focusScore: row.focus_score ? parseFloat(row.focus_score) : 0,
        emotionBreakdown: row.emotion_breakdown ?? {},
      }
    : computeAnalysis(snapshots);

  return {
    sessionId: row.id,
    userId: row.user_id,
    sessionType: row.session_type,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    snapshotCount: row.snapshot_count,
    snapshots: snapshots.map((s) => ({
      emotion: s.emotion,
      gaze: s.gaze,
      confusion: s.confusion,
      timestamp: Number(s.client_ts),
      confidence: s.confidence ? parseFloat(s.confidence) : undefined,
    })),
    analysis,
  };
}

export async function listHistory(
  userId: string,
  params: { startDate?: string; endDate?: string; sessionType?: string; limit: number; offset: number },
) {
  const conditions: string[] = ['user_id = $1'];
  const values: unknown[] = [userId];
  let idx = 2;

  if (params.startDate) {
    conditions.push(`started_at >= $${idx++}`);
    values.push(params.startDate);
  }
  if (params.endDate) {
    conditions.push(`started_at <= $${idx++}`);
    values.push(params.endDate);
  }
  if (params.sessionType) {
    conditions.push(`session_type = $${idx++}`);
    values.push(params.sessionType);
  }

  const where = conditions.join(' AND ');

  const { rows: countRows } = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM emotion_sessions WHERE ${where}`,
    values,
  );
  const total = parseInt(countRows[0]!.count, 10);

  const { rows } = await db.query<SessionRow>(
    `SELECT * FROM emotion_sessions WHERE ${where}
     ORDER BY started_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, params.limit, params.offset],
  );

  const sessions = rows.map((row) => ({
    sessionId: row.id,
    sessionType: row.session_type,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    snapshotCount: row.snapshot_count,
    focusScore: row.focus_score ? parseFloat(row.focus_score) : null,
    emotionBreakdown: row.emotion_breakdown ?? {},
  }));

  return { sessions, total };
}

export async function getTrends(
  userId: string,
  granularity: 'daily' | 'weekly' | 'monthly',
  days: number,
) {
  const truncMap = { daily: 'day', weekly: 'week', monthly: 'month' } as const;
  const trunc = truncMap[granularity];

  // Fetch per-session data so we can compute weighted emotion breakdowns in JS
  const { rows } = await db.query<{
    period: Date;
    focus_score: string | null;
    snapshot_count: string;
    emotion_breakdown: Record<string, number> | null;
  }>(
    `SELECT
       DATE_TRUNC($1, started_at) AS period,
       focus_score,
       snapshot_count,
       emotion_breakdown
     FROM emotion_sessions
     WHERE user_id = $2
       AND started_at >= NOW() - ($3 || ' days')::interval
       AND ended_at IS NOT NULL
     ORDER BY period DESC`,
    [trunc, userId, days],
  );

  // Group by period and compute weighted averages
  const periodMap = new Map<string, {
    period: Date;
    totalSnapshots: number;
    focusSum: number;
    focusCount: number;
    emotionWeights: Record<string, number>;
  }>();

  for (const row of rows) {
    const key = row.period.toISOString();
    if (!periodMap.has(key)) {
      periodMap.set(key, { period: row.period, totalSnapshots: 0, focusSum: 0, focusCount: 0, emotionWeights: {} });
    }
    const entry = periodMap.get(key)!;
    const snaps = parseInt(row.snapshot_count, 10);

    if (row.focus_score !== null) {
      entry.focusSum += parseFloat(row.focus_score);
      entry.focusCount++;
    }

    if (row.emotion_breakdown && snaps > 0) {
      entry.totalSnapshots += snaps;
      for (const [emotion, proportion] of Object.entries(row.emotion_breakdown)) {
        entry.emotionWeights[emotion] = (entry.emotionWeights[emotion] ?? 0) + proportion * snaps;
      }
    }
  }

  const data = Array.from(periodMap.values()).map((entry) => {
    const emotionBreakdown: Record<string, number> = {};
    if (entry.totalSnapshots > 0) {
      for (const [emotion, weight] of Object.entries(entry.emotionWeights)) {
        emotionBreakdown[emotion] = Math.round((weight / entry.totalSnapshots) * 1000) / 1000;
      }
    }

    return {
      date: entry.period,
      sessionCount: rows.filter((r) => r.period.toISOString() === entry.period.toISOString()).length,
      focusScore: entry.focusCount > 0
        ? Math.round((entry.focusSum / entry.focusCount) * 1000) / 1000
        : null,
      emotionBreakdown,
    };
  });

  return { granularity, data };
}

export async function deleteSession(sessionId: string, userId: string) {
  const { rowCount } = await db.query(
    `DELETE FROM emotion_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId],
  );
  return rowCount != null && rowCount > 0;
}
