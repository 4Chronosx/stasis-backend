DROP TABLE IF EXISTS streak_info;

CREATE TABLE IF NOT EXISTS streak_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  completed_cards INTEGER NOT NULL DEFAULT 0 CHECK (completed_cards >= 0),
  remind_user BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO streak_info (profile_id)
SELECT id
FROM profiles
ON CONFLICT (profile_id) DO NOTHING;

ALTER TABLE profiles
  DROP COLUMN IF EXISTS current_streak,
  DROP COLUMN IF EXISTS last_studied_date,
  DROP COLUMN IF EXISTS streak_reminder_sent_date;