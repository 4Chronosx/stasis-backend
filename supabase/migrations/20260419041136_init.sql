-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_studied_date DATE
);

-- user_preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  attention_score INTEGER NOT NULL DEFAULT 0,
  adhd_score INTEGER NOT NULL DEFAULT 0,
  stress_score INTEGER NOT NULL DEFAULT 0,
  memory_score INTEGER NOT NULL DEFAULT 0,
  speed_score INTEGER NOT NULL DEFAULT 0,
  grit_score INTEGER NOT NULL DEFAULT 0,
  motivation_score INTEGER NOT NULL DEFAULT 0,
  adaptive_params JSONB NOT NULL DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- learning_topics
CREATE TABLE learning_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- decks
CREATE TABLE decks (
  id SERIAL PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES learning_topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- flash_cards
CREATE TABLE flash_cards (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- card_state
CREATE TABLE card_state (
  id SERIAL PRIMARY KEY,
  flash_card_id INTEGER NOT NULL UNIQUE REFERENCES flash_cards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review')),
  interval_days INTEGER NOT NULL DEFAULT 0,
  ease NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  step INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);