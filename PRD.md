## Problem Statement

STASIS is a fully designed adaptive learning platform with a complete database schema, project scaffold, and CI/CD pipeline — but zero business logic implemented. All 11 backend modules are empty stubs, no routes are wired, and critical middleware (auth, error handling, rate limiting) does not exist. The backend cannot serve any API request beyond a health check. Students who need an emotion-aware, AI-powered study tool cannot use STASIS until the backend is fully implemented.

## Solution

Implement the complete STASIS backend across all core modules: authentication, onboarding, materials upload, AI flashcard generation, spaced repetition review, dashboard analytics, real-time emotion-driven adaptive interventions, offline-first flashcard review with sync-on-reconnect, and streak reminder notifications via a scheduled cron job. All missing dependencies will be installed and configured as part of this implementation.

## User Stories

### Dependency Setup
1. As a developer, I want all required npm packages installed and configured, so that the backend has the libraries it needs to function.
2. As a developer, I want a shared TypeScript types and interfaces layer, so that all modules share consistent type definitions.

### Authentication
3. As a user, I want to sign in with my Google account, so that I do not need to create a separate username and password.
4. As a user, I want my profile to be automatically created on first login, so that I can start using STASIS immediately after signing in.
5. As a user, I want to be able to log out, so that my session is securely terminated.
6. As a user, I want the app to remember my session across page reloads, so that I do not have to sign in every time I visit.
7. As a developer, I want all protected routes to require a valid session, so that unauthenticated users cannot access user data.
8. As a developer, I want a global error handler middleware, so that all unhandled errors return consistent JSON responses.
9. As a developer, I want rate limiting applied to the API, so that the backend is protected from abuse.

### Onboarding
10. As a new user, I want to be prompted to complete an onboarding quiz on first login, so that STASIS can build my personalized learner profile.
11. As a new user, I want to answer questions about my attention span, stress level, memory, reading speed, perseverance, and motivation, so that the adaptive engine can be calibrated to my needs.
12. As a user, I want my onboarding scores to be computed into adaptive parameters, so that session difficulty and pacing are personalized from the start.
13. As a user, I want to be able to check whether I have completed onboarding, so that the frontend can redirect me to the correct screen.

### Preferences
14. As a user, I want to view my current preferences, so that I can review my learner profile at any time.
15. As a user, I want to update my preferences, so that I can adjust my adaptive learning parameters as my needs change.

### Materials Upload
16. As a user, I want to upload a PDF, DOCX, or TXT study file, so that STASIS can extract its content for flashcard generation.
17. As a user, I want the backend to validate my uploaded file type and size, so that unsupported or oversized files are rejected with a clear error.
18. As a user, I want the extracted text from my uploaded file to be returned to me, so that I can confirm the content before generating flashcards.

### Flashcard Generation
19. As a user, I want to generate flashcard question-and-answer pairs from my uploaded study material using AI, so that I do not have to write flashcards manually.
20. As a user, I want generated flashcards to be automatically organized into a deck under a learning topic, so that my study materials stay structured.
21. As a user, I want each new flashcard to have a card state record initialized, so that spaced repetition tracking begins immediately.
22. As a user, I want to view all my flashcard decks, so that I can browse my study materials.
23. As a user, I want to view the cards inside a specific deck, so that I can review the generated content.
24. As a user, I want to delete a deck, so that I can remove study material I no longer need.

### Spaced Repetition Review
25. As a user, I want to retrieve all flashcards that are due for review today, so that I study at the optimal time for memory retention.
26. As a user, I want to mark a card as easy, medium, or hard after reviewing it, so that the spaced repetition algorithm can schedule it correctly.
27. As a user, I want card intervals and ease factors to be updated after each review, so that harder cards appear more frequently and easier cards less so.
28. As a user, I want new cards to progress through a learning sequence before entering long-interval review, so that I build initial familiarity before spacing out reviews.

### Dashboard Analytics
29. As a user, I want to see the total number of flashcards I have created, so that I can track how much content I have built up.
30. As a user, I want to see my current study streak, so that I am motivated to maintain consistent daily study.
31. As a user, I want to see my total study time, so that I can reflect on the effort I have invested.
32. As a user, I want to see my recent activity history, so that I have an overview of what I have been studying.
33. As a user, I want my streak to increment when I complete a study session, reset when I miss a day, and persist correctly across time zones using local calendar dates.

### Streak Reminders
34. As a user, I want to receive an email reminder every 3 hours if I have not yet studied today, so that I am prompted to log in before my streak ends at midnight.
35. As a user, I want reminder emails to stop once I have completed a study session for the day, so that I am not emailed unnecessarily after I have already maintained my streak.

### Emotion Detection and Adaptive Interventions
36. As a user, I want to connect to a real-time WebSocket during a study session, so that my emotion data can be streamed to the backend continuously.
37. As a user, I want the backend to buffer my recent emotion frames in memory, so that the adaptive engine can detect sustained emotional states.
38. As a user, I want the backend to trigger a smart intervention when it detects a sustained negative emotional state (sad, angry, disgusted, fearful), so that my mood is addressed without pausing the session.
39. As a user, I want the Pomodoro timer on the frontend to be completely unaffected by interventions, so that my study structure is maintained.
40. As a user, I want to receive a motivational meme, image, or quote as an intervention, so that I get a light mood boost before the next flashcard.
41. As a user, I want to receive a face challenge intervention where I am prompted to make a specific facial expression, so that the physical act of changing my expression shifts my emotional state.
42. As a user, I want to receive a micro-celebration when I am on a streak of correct answers, so that my momentum is positively reinforced.
43. As a user, I want each intervention type to have a cooldown period after it fires, so that I am not spammed with repeated interventions.
44. As a user, I want face challenge validation to happen entirely in the browser via face-api.js, so that no webcam data is ever sent to the server.
45. As a developer, I want the emotion buffer and cooldown state to be stored in memory per WebSocket connection, so that it is automatically cleaned up when the session ends.

### Offline-First Flashcard Review
46. As a user, I want to download a deck bundle containing all cards and their current card states, so that I can study offline without an internet connection.
47. As a user, I want card state changes made while offline to be queued locally in my browser, so that my review progress is not lost.
48. As a user, I want my offline review progress to be synced back to the backend when I reconnect, so that my spaced repetition schedule stays accurate.
49. As a user, I want the sync to use timestamp-based last-write-wins conflict resolution, so that the most recent review result is always applied correctly.
50. As a user, I want AI flashcard generation and emotion detection to gracefully degrade when I am offline, so that I understand which features require connectivity.

## Implementation Decisions

### Dependency Installation
- Install: `socket.io`, `passport`, `passport-google-oauth20`, `express-session`, `connect-pg-simple`, `multer`, `@anthropic-ai/sdk`, `express-rate-limit`, `pdf-parse`, `mammoth`, `node-cron`, `nodemailer`
- Install types: `@types/passport`, `@types/passport-google-oauth20`, `@types/express-session`, `@types/multer`, `@types/pdf-parse`, `@types/mammoth`, `@types/node-cron`, `@types/nodemailer`

### Types Layer
- Create `src/types/index.ts` with shared interfaces: `AuthenticatedRequest`, `EmotionFrame`, `InterventionPayload`, `CardStateUpdate`, `AdaptiveParams`
- Extend Express `Request` to include `req.user` with the authenticated profile

### Middleware
- `auth.middleware.ts` — verifies `req.session.user`, attaches to `req.user`, returns 401 if missing
- `error.middleware.ts` — global Express error handler, returns `{ error: message }` with appropriate status codes
- `rateLimiter.middleware.ts` — apply `express-rate-limit` globally and stricter limits on `/api/materials/upload` and `/api/flashcards/generate`

### Authentication Module
- Use `passport` with `passport-google-oauth20` strategy
- On successful OAuth callback, upsert the user into `profiles` using Google sub as the UUID
- Create a `user_preferences` row with defaults if this is the first login (`onboarding_completed: false`)
- Store session in PostgreSQL using `connect-pg-simple` for persistence across server restarts
- `GET /api/auth/me` returns the session user or 401

### Onboarding Module
- `POST /api/onboarding/complete` accepts the 7 onboarding scores, computes `adaptive_params` as a JSONB object, sets `onboarding_completed: true`
- `adaptive_params` shape: `{ focusDuration, breakInterval, cardDifficulty, pacingSpeed, interventionThreshold }` — all derived from weighted combinations of the 7 scores
- `GET /api/onboarding/status` returns `{ completed: boolean }`

### Materials Module
- Use `multer` with memory storage, 10MB limit, accept PDF/DOCX/TXT only
- PDF text extraction: `pdf-parse`
- DOCX text extraction: `mammoth`
- TXT: read buffer directly
- `POST /api/materials/upload` returns `{ text: string }` — extracted content ready for flashcard generation

### Flashcards Module
- `POST /api/flashcards/generate` accepts `{ text, topicTitle, deckName }`, calls Claude API to generate Q&A pairs, inserts topic, deck, flash_cards, and card_state in a single transaction
- Claude prompt instructs the model to return a JSON array of `{ question, answer }` objects
- Use `claude-sonnet-4-6` model with prompt caching on the system prompt for repeated generation calls
- `GET /api/flashcards` returns all topics with nested decks for the authenticated user
- `GET /api/flashcards/:deckId` returns the deck with all its cards
- `DELETE /api/flashcards/:deckId` cascades to cards and card states

### Spaced Repetition Review Module
- Implement SM-2 algorithm: `new` to `learning` (step-based intervals) to `review` (interval x ease)
- Quality ratings: `again` (0), `hard` (1), `good` (2), `easy` (3)
- `GET /api/cards/:deckId/due` returns cards where `next_review_at <= NOW()` OR `status = 'new'`
- `PATCH /api/cards/:cardId/state` accepts `{ quality }`, computes new interval, ease, step, status, and `next_review_at`, writes to `card_state`

### Dashboard Module
- `GET /api/dashboard/stats` returns: `{ totalCards, currentStreak, totalDecks, totalTopics }`
- `GET /api/dashboard/activity` returns recent card state updates (last 7 days), grouped by day
- Streak logic: compare `last_studied_date` to today's local date; increment if yesterday, reset if older, update `last_studied_date` to today. Triggered on card state update.

### Streak Reminder Cron Job
- Use `node-cron` to schedule a job that runs every 3 hours (`0 */3 * * *`)
- On each run, query all users whose `last_studied_date` is not today AND `streak_reminder_sent_date` is not today
- For each matched user, send a streak reminder email via `nodemailer` with the subject "Don't break your streak!" and a prompt to log in before midnight
- After sending, set `streak_reminder_sent_date = today` on the user's profile row to prevent duplicate emails for the rest of the day
- When a user completes a study session and `last_studied_date` is updated to today, the cron query naturally excludes them — no further emails are sent
- The cron job is initialized in `src/index.ts` alongside the HTTP server startup

### WebSocket Server
- Initialize Socket.io in `src/socket.ts`, attach to the HTTP server in `src/index.ts`
- Authenticate WebSocket connections using the Express session
- On connect: create in-memory `EmotionSession` object `{ buffer: string[], cooldowns: Map<string, number>, streak: number }`
- On disconnect: delete the `EmotionSession` from memory

### Adaptive Learning Engine
- Rule engine evaluates the emotion buffer on every `emotion:frame` event
- Buffer holds the last 5 emotion labels; rule threshold is 3 consecutive negative emotions
- Negative emotions: `sad`, `angry`, `disgusted`, `fearful`
- Intervention selection: if cooldowns allow, randomly select between `motivational` and `face_challenge`
- Motivational content: randomly selected from a hardcoded list of quotes/prompts
- Face challenge: randomly selected target expression from `['smile', 'frown', 'surprised']`
- Micro-celebration: triggered when `streak >= 3` correct answers, pushes `{ type: 'celebration' }`
- Streak tracked per socket via a `review:result` WebSocket event sent by the frontend after each card answer
- Cooldowns (in-memory per socket): `motivational` 3 min, `face_challenge` 5 min, `celebration` 2 min

### Offline-First Module
- `GET /api/flashcards/:deckId/bundle` returns `{ deck, cards: [{ ...card, state: cardState }] }` as a single cacheable payload
- `POST /api/cards/sync` accepts `{ updates: [{ cardId, quality, reviewedAt }] }`, applies each update only if `reviewedAt` is newer than `last_reviewed_at` in the database (last-write-wins)
- Sync runs in a single transaction; partial failures return per-card error details

### Route Wiring
- Wire all implemented routes in `src/index.ts`
- Mount Socket.io server on the same HTTP server instance

### Schema Additions
- No new tables required for this phase
- `connect-pg-simple` will create a `session` table automatically on first run
- `adaptive_params` JSONB includes a `version` field to allow future schema evolution without a migration
- Add `streak_reminder_sent_date DATE` column to `profiles` — used by the cron job to ensure at most one reminder email is sent per user per day

## Testing Decisions

Testing is not a priority for this phase. No test files will be written as part of this implementation. The CI pipeline already enforces typechecking, linting, and format checking as a proxy for code quality.

## Out of Scope

- **Session tracking** — study session start/end, session history, and the `sessions` table are deferred to a later issue
- **Settings module** — timer, camera, and notification settings are deferred to a later issue
- **Account soft/hard deletion cron jobs** — deferred to a later issue
- **Emotion history persistence** — no `session_emotions` table; emotion data lives only in WebSocket memory
- **Lighthouse CI** — post-deploy frontend performance checks are deferred
- **Test coverage** — no unit or integration tests in this phase
- **Frontend implementation** — this PRD covers the backend only

## Further Notes

- The Pomodoro timer runs entirely on the frontend and has no backend representation. The backend is never aware of timer state.
- No webcam data or image frames are ever sent to the server. Only detected emotion label strings are transmitted via WebSocket.
- Face challenge expression validation happens entirely in the browser via face-api.js. The backend only sends the target expression prompt.
- The offline bundle endpoint should be treated as a snapshot — it reflects card states at the time of download. Conflict resolution on sync handles divergence.
- All routes except `/api/auth/google` and `/api/auth/callback` must be protected by `auth.middleware.ts`.
- The streak reminder cron runs on a fixed UTC schedule. Timezone awareness is handled by comparing against the user's local calendar date stored in `last_studied_date`, not by adjusting the cron schedule per user.
