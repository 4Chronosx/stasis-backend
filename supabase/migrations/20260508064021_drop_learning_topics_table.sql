-- 1. Add user_id column to decks
ALTER TABLE decks ADD COLUMN user_id TEXT;

-- 2. Populate existing rows from learning_topics
UPDATE decks 
SET user_id = lt.user_id
FROM learning_topics lt
WHERE decks.topic_id = lt.id;

-- 3. Set NOT NULL
ALTER TABLE decks ALTER COLUMN user_id SET NOT NULL;

-- 4. Add FK constraint to profiles
ALTER TABLE decks ADD CONSTRAINT decks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id);

-- 5. Drop the FK constraint referencing learning_topics
ALTER TABLE decks DROP CONSTRAINT decks_topic_id_fkey;

-- 6. Drop the topic_id column
ALTER TABLE decks DROP COLUMN topic_id;

-- 7. Drop learning_topics table
DROP TABLE learning_topics;