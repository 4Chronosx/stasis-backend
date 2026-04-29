-- 1. Drop FK constraints first
ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_user_id_fkey;
ALTER TABLE learning_topics DROP CONSTRAINT learning_topics_user_id_fkey;

-- 2. Now alter the column types
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE user_preferences ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE learning_topics ALTER COLUMN user_id TYPE TEXT;

-- 3. Re-add the FK constraints
ALTER TABLE user_preferences 
  ADD CONSTRAINT user_preferences_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id);

ALTER TABLE learning_topics 
  ADD CONSTRAINT learning_topics_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id);