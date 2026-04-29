ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_reminder_sent_date DATE;
