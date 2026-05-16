ALTER TABLE user_preferences ADD COLUMN (
  privacy_comfort VARCHAR(20) CHECK (privacy_comfort IN ('visible', 'hidden', 'off')),
  expression_tolerance VARCHAR(20) CHECK (expression_tolerance IN ('neutral', 'intense', 'variable')),
  study_block_length INTEGER CHECK (study_block_length >= 5 AND study_block_length <= 120),
  mini_breaks_per_session INTEGER CHECK (mini_breaks_per_session >= 1 AND mini_breaks_per_session <= 10),
  recovery_duration INTEGER CHECK (recovery_duration >= 5 AND recovery_duration <= 30),
  break_mechanic VARCHAR(20) CHECK (break_mechanic IN ('relaxed', 'accountable')),
  show_timer BOOLEAN DEFAULT TRUE,
  onboarding_completed_at TIMESTAMPTZ
);
