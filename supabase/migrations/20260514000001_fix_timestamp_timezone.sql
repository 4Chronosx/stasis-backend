-- Change TIMESTAMP → TIMESTAMPTZ on cards and review_logs.
-- Existing values were created by Node.js new Date() (UTC), so we reinterpret
-- each bare timestamp as UTC when converting rather than losing that information.

ALTER TABLE cards
  ALTER COLUMN due         TYPE TIMESTAMPTZ USING due         AT TIME ZONE 'UTC',
  ALTER COLUMN last_review TYPE TIMESTAMPTZ USING last_review AT TIME ZONE 'UTC';

ALTER TABLE review_logs
  ALTER COLUMN due    TYPE TIMESTAMPTZ USING due    AT TIME ZONE 'UTC',
  ALTER COLUMN review TYPE TIMESTAMPTZ USING review AT TIME ZONE 'UTC';
