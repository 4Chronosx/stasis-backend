ALTER TABLE user_preferences
  ADD COLUMN privacy_comfort VARCHAR(20) CHECK (privacy_comfort IN ('visible', 'hidden', 'off')),
  ADD COLUMN expression_tolerance VARCHAR(20) CHECK (expression_tolerance IN ('neutral', 'intense', 'variable')),
  ADD COLUMN study_block_length INTEGER CHECK (study_block_length >= 5 AND study_block_length <= 120),
  ADD COLUMN mini_breaks_per_session INTEGER CHECK (mini_breaks_per_session >= 1 AND mini_breaks_per_session <= 10),
  ADD COLUMN recovery_duration INTEGER CHECK (recovery_duration >= 5 AND recovery_duration <= 30),
  ADD COLUMN break_mechanic VARCHAR(20) CHECK (break_mechanic IN ('relaxed', 'accountable')),
  ADD COLUMN show_timer BOOLEAN DEFAULT TRUE,
  ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
