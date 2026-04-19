# STASIS — Emotion-Aware AI-Empowered Learning

> A full-stack adaptive learning web application that improves study efficiency through intelligent flashcard generation, real-time emotion detection, and dynamic session adaptation.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [WebSockets](#websockets)
- [Cron Jobs](#cron-jobs)
- [Authentication](#authentication)
- [Environment Variables](#environment-variables)

---

## Overview

STASIS is a personalized study platform that combines machine learning, natural language processing, and WebSocket-based real-time communication to deliver an adaptive study experience. The system detects the learner's emotional state via webcam, adjusts session difficulty and pacing in real time, and generates flashcards automatically from uploaded study materials using the Claude LLM API.

---

## Core Features

### 1. AI Flashcard Generation
Users upload study materials in PDF, DOCX, or TXT format. STASIS extracts the content and sends it to the Claude LLM API, which generates question-and-answer flashcard pairs. Flashcards are organized into decks and tied to a learning topic.

### 2. Spaced Repetition Engine
A spaced repetition algorithm tracks each card's difficulty, review interval, and ease factor. Cards due for review are surfaced at the optimal time to maximize long-term memory retention.

### 3. Emotion-Aware Pomodoro Timer
Integrates an emotion-aware study timer built on the Pomodoro technique. During a session, the user's webcam continuously captures facial expressions which are analyzed in real time by `face-api.js`, a browser-based facial emotion recognition ML model. Detected emotions are streamed via WebSocket to the Adaptive Learning Engine.

### 4. Smart Session Interventions
Based on detected emotions fed back by the Adaptive Learning Engine, STASIS pushes instant smart interventions to the user without interrupting the session flow.

### 5. Adaptive Learning Engine
Continuously receives emotion data and session performance to dynamically adjust session length, flashcard difficulty, pacing, break timing, and suggest smart session interventions — personalizing the study experience in real time for each learner.

### 6. Learner Profile and Onboarding
Guides users through a short onboarding quiz to build a personalized learner profile covering learning style, pace preference, focus patterns, and feedback preference.

### 7. Live Notification System
Includes a scheduled notification system powered by cron jobs. Users receive timely reminders for upcoming study sessions, spaced repetition review schedules, and study streak alerts, delivered via in-app notifications or email.

### 8. Dashboard Analytics
Gives learners a clear overview of their progress including total flashcards created, current study streak, total time spent, and recent activity.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript |
| Backend | Express.js, TypeScript |
| Database | Supabase (PostgreSQL) |
| AI | Claude LLM API (Anthropic) |
| Emotion Detection | face-api.js (browser-based) |
| Real-time | WebSockets |
| Scheduling | node-cron |
| Auth | Google OAuth |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                      DATA LAYER                     │
│          Supabase PostgreSQL  ←  Cache Layer        │
│                  ↑                                  │
│             Cron Job Scheduler                      │
└─────────────────────────────────────────────────────┘
              ↑                    ↑
┌─────────────────────┐   ┌───────────────────────────┐
│   BACKEND SERVICES  │   │         AI LAYER          │
│                     │   │                           │
│  Adaptive Learning  │   │     Claude LLM API        │
│       Engine        │   │                           │
│         ↑           │   │  Facial Emotion ML Model  │
│   Core API Service  │   └───────────────────────────┘
│         ↑                         ↑
│  Flashcard Generation Service     │
│         ↑                         │
│  Emotion Detection Service ───────┘
│         ↑
│  Notification Service
└─────────────────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────────────────┐
│                     FRONTEND                        │
│              User  ←→  WebSocket Server             │
│                                                     │
│         Google OAuth      Rate Limiting             │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema

### `profiles`
Core user identity record — the root of all user-linked data.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key; foreign key anchor for all user tables |
| full_name | TEXT | User's display name (optional) |
| email | TEXT | Unique email address |
| avatar_url | TEXT | Profile picture URL (optional) |
| current_streak | INTEGER | Consecutive days with a completed session (default 0) |
| last_studied_date | DATE | Local calendar date of the last completed session; used to increment, maintain, or reset the streak |

### `user_preferences`
Onboarding assessment results and adaptive learning parameters per user.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | References `profiles.id` (one-to-one) |
| attention_score | INTEGER | Onboarding score for attention span |
| adhd_score | INTEGER | Onboarding score for ADHD-related tendencies |
| stress_score | INTEGER | Onboarding score for stress level |
| memory_score | INTEGER | Onboarding score for memory retention |
| speed_score | INTEGER | Onboarding score for reading/processing speed |
| grit_score | INTEGER | Onboarding score for perseverance |
| motivation_score | INTEGER | Onboarding score for motivation |
| adaptive_params | JSONB | Computed algorithm parameters derived from scores |
| onboarding_completed | BOOLEAN | Whether the user has finished onboarding |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last modification time |

### `learning_topics`
User-defined top-level subject areas that organize decks of flashcards.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | References `profiles.id` |
| title | TEXT | Display name of the topic |
| description | TEXT | Optional description of the topic's scope |
| order | INTEGER | Sort position for user-defined ordering |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last modification time |

### `topic_decks`
Junction table linking learning topics to flashcard decks.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| topic_id | UUID | References `learning_topics.id` |
| deck_id | INTEGER | References `flash_cards.fc_id` |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last modification time |

### `flash_cards`
Individual flashcard content — the question and answer pairs users study.

| Column | Type | Description |
|---|---|---|
| fc_id | INTEGER | Primary key; referenced by `topic_decks` and `card_state` |
| fc_name | TEXT | Short label or title for the flashcard |
| description | TEXT | Optional extra context or notes |
| question | TEXT | Prompt shown to the user during review |
| answer | TEXT | Expected answer revealed after the user responds |
| created_at | TIMESTAMP | Creation time |

### `card_state`
Spaced repetition state for each flashcard — tracks scheduling and review history.

| Column | Type | Description |
|---|---|---|
| cs_id | INTEGER | Primary key |
| fc_id | INTEGER | References `flash_cards.fc_id` |
| status | TEXT | Learning stage: `new`, `learning`, `review` |
| interval_days | INTEGER | Days until the card should next be shown |
| ease | INTEGER | Ease factor for the spaced repetition algorithm (default 2.5) |
| step | INTEGER | Current step in the learning sequence |
| next_review_at | TIMESTAMP | Scheduled datetime for next appearance |
| last_reviewed_at | TIMESTAMP | Datetime of most recent review (null if never reviewed) |
| created_at | TIMESTAMP | Record creation time |

---

## Project Structure

```
src/
├── index.ts                          # Entry point — starts HTTP server
├── app.ts                            # Express app config, middleware registration
├── socket.ts                         # WebSocket server setup
│
├── config/
│   ├── db.ts                         # Supabase client initialization
│   └── env.ts                        # Environment variable validation and exports
│
├── middleware/
│   ├── auth.middleware.ts            # Verifies session, attaches req.user
│   ├── error.middleware.ts           # Global Express error handler
│   └── rateLimiter.middleware.ts     # express-rate-limit setup
│
├── types/
│   └── index.ts                      # Shared interfaces, Express Request extension
│
└── modules/
    ├── auth/
    │   ├── auth.routes.ts
    │   ├── auth.controller.ts
    │   └── auth.service.ts           # Google OAuth logic, session handling
    │
    ├── onboarding/
    │   ├── onboarding.routes.ts
    │   ├── onboarding.controller.ts
    │   └── onboarding.service.ts     # Learner profile scoring, adaptive_params computation
    │
    ├── preferences/
    │   ├── preferences.routes.ts
    │   ├── preferences.controller.ts
    │   └── preferences.service.ts
    │
    ├── materials/
    │   ├── materials.routes.ts
    │   ├── materials.controller.ts
    │   └── materials.service.ts      # File upload handling (PDF, DOCX, TXT)
    │
    ├── flashcards/
    │   ├── flashcards.routes.ts
    │   ├── flashcards.controller.ts
    │   ├── flashcards.service.ts     # Topic + deck CRUD
    │   └── flashcards.ai.ts          # Claude LLM integration for generation
    │
    ├── review/
    │   ├── review.routes.ts
    │   ├── review.controller.ts
    │   └── review.service.ts         # Spaced repetition logic, card state updates
    │
    ├── session/
    │   ├── session.routes.ts
    │   ├── session.controller.ts
    │   └── session.service.ts        # Session start/end, progress tracking
    │
    ├── emotion/
    │   ├── emotion.routes.ts
    │   ├── emotion.controller.ts
    │   ├── emotion.service.ts        # Emotion frame analysis
    │   └── emotion.socket.ts         # WebSocket handlers for real-time emotion stream
    │
    ├── adaptive/
    │   ├── adaptive.routes.ts
    │   ├── adaptive.controller.ts
    │   └── adaptive.service.ts       # Difficulty adjustment, recommendations
    │
    ├── dashboard/
    │   ├── dashboard.routes.ts
    │   ├── dashboard.controller.ts
    │   └── dashboard.service.ts      # Stats aggregation, activity history
    │
    ├── notifications/
    │   ├── notifications.routes.ts
    │   ├── notifications.controller.ts
    │   ├── notifications.service.ts
    │   └── notifications.cron.ts     # Cron jobs: streak reminders, soft deletion
    │
    └── settings/
        ├── settings.routes.ts
        ├── settings.controller.ts
        └── settings.service.ts       # Timer, camera, notification settings
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/callback` | Handle OAuth callback |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user session |

### Onboarding
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/onboarding/status` | Check if onboarding is completed |
| POST | `/api/onboarding/complete` | Submit learner profile answers |

### Preferences
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/preferences` | Get user preferences |
| PATCH | `/api/preferences` | Update user preferences |

### Materials
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/materials/upload` | Upload PDF, DOCX, or TXT file |

### Flashcards
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/flashcards/generate` | Generate flashcards from uploaded material via Claude LLM |
| GET | `/api/flashcards` | Get all flashcard decks |
| GET | `/api/flashcards/:deckId` | Get a specific deck |
| DELETE | `/api/flashcards/:deckId` | Delete a deck |

### Review (Spaced Repetition)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cards/:deckId/due` | Get cards due for review today |
| PATCH | `/api/cards/:cardId/state` | Update card state after review (interval, ease) |

### Study Session
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/session/start` | Start a new study session |
| PATCH | `/api/session/:sessionId` | Update session progress |
| POST | `/api/session/:sessionId/end` | End session and save stats |
| GET | `/api/session/history` | Get past study sessions |

### Emotion Detection
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/emotion/analyze` | Send camera frame for emotion analysis |
| WS | `/ws/emotion` | WebSocket for real-time emotion detection and interventions |

### Adaptive Learning Engine
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/adaptive/recommend` | Get recommended next topic or difficulty |
| PATCH | `/api/adaptive/adjust` | Update session difficulty based on emotion data |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Get total cards, study streak, time spent |
| GET | `/api/dashboard/activity` | Get recent activity history |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get all notifications for user |
| PATCH | `/api/notifications/:id` | Mark notification as read |
| POST | `/api/notifications/schedule` | Schedule a study session reminder |
| DELETE | `/api/notifications/:id` | Delete a notification |

### Settings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/settings` | Get all user settings |
| PATCH | `/api/settings/timer` | Update Pomodoro timer settings |
| PATCH | `/api/settings/camera` | Update camera and AI settings |
| PATCH | `/api/settings/notifications` | Update notification preferences |

---

## WebSockets

### `/ws/emotion`
Handles real-time emotion detection during study sessions. The frontend streams webcam frames or detected emotion labels from `face-api.js` to the backend. The Adaptive Learning Engine processes the emotion data and pushes interventions back to the client without interrupting the session flow.

**Events (client → server)**
- `emotion:frame` — sends detected emotion data from face-api.js
- `session:ping` — keeps the connection alive

**Events (server → client)**
- `intervention:suggest` — pushes a smart intervention (e.g. "Take a break")
- `session:adjust` — notifies the client of a difficulty or pacing change

---

## Cron Jobs

### Streak Reminder
Runs every 3 hours before the end of the day. If a user has not logged in yet that day, a notification is sent reminding them that their streak is at risk.

### Account Soft Deletion
Inactive accounts are soft-deleted after a configured number of inactive days. If inactivity exceeds a permanent deletion threshold, the account is hard-deleted from the database.

---

## Authentication

STASIS uses **Google OAuth** for secure, token-based login. Users sign in with their Google accounts. On successful OAuth callback, a session is created and the user's profile is upserted into the `profiles` table.

All protected routes require a valid session verified by `auth.middleware.ts`, which attaches the authenticated user to `req.user`.

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# Anthropic
ANTHROPIC_API_KEY=

# Session
SESSION_SECRET=

# Frontend
CLIENT_URL=http://localhost:3001
```