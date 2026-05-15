ALTER TABLE user_preferences
  ADD COLUMN runtime_preferences JSONB NOT NULL DEFAULT '{
    "privacy_comfort": "off",
    "emotion_detection": false,
    "expression_tolerance": "neutral",
    "study_block_length": 25,
    "mini_breaks_per_session": 2,
    "break_mechanic": "relaxed",
    "recovery_duration": 10,
    "show_timer": true
  }'::jsonb,
  ADD COLUMN onboarding_snapshot JSONB;
