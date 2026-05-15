-- emotion_sessions
CREATE TABLE emotion_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL DEFAULT 'pomodoro',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  snapshot_count INTEGER NOT NULL DEFAULT 0,
  focus_score DECIMAL(4,3),
  emotion_breakdown JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emotion_sessions_user_date
  ON emotion_sessions(user_id, started_at DESC);

-- emotion_snapshots
CREATE TABLE emotion_snapshots (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES emotion_sessions(id) ON DELETE CASCADE,
  emotion VARCHAR(50) NOT NULL,
  gaze VARCHAR(50) NOT NULL DEFAULT 'center',
  confusion BOOLEAN NOT NULL DEFAULT FALSE,
  client_ts BIGINT NOT NULL,
  confidence DECIMAL(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emotion_snapshots_session_time
  ON emotion_snapshots(session_id, client_ts);
