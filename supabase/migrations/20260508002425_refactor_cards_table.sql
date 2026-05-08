

DROP TABLE card_state;
DROP TABLE flash_cards;

CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    due TIMESTAMP NOT NULL DEFAULT NOW(),
    stability FLOAT NOT NULL DEFAULT 0,
    difficulty FLOAT NOT NULL DEFAULT 0,
    scheduled_days INTEGER NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    state INTEGER NOT NULL DEFAULT 0,
    last_review TIMESTAMP
);

CREATE TABLE review_logs (
    id SERIAL PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    state INTEGER NOT NULL,
    due TIMESTAMP NOT NULL,
    review TIMESTAMP NOT NULL,
    stability FLOAT NOT NULL,
    difficulty FLOAT NOT NULL,
    scheduled_days INTEGER NOT NULL,
    last_elapsed_days INTEGER NOT NULL
);