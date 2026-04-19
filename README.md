<h1 align="center">STASIS 🧠</h1>
<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<div align="center">
  <br />
  <p align="center">
    <a href="#"><img alt="Status" src="https://img.shields.io/badge/status-In%20Development-blue?style=flat&color=blue" /></a>
    <a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-2B2B2B?logo=nextdotjs&logoColor=white&style=flat" /></a>
    <a href="https://expressjs.com/"><img alt="Express" src="https://img.shields.io/badge/Express.js-4-000000?logo=express&logoColor=white&style=flat" /></a>
  </p>
  <p align="center">
    <br />
    Study Smarter. Feel Supported. Adapt in Real Time.
    <br />
    <br />
  </p>
  <a href="https://github.com/4Chronosx/stasis/issues/new?labels=bug">Report Bug</a>
  &middot;
  <a href="https://github.com/4Chronosx/stasis/issues/new?labels=enhancement">Request Feature</a>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#%EF%B8%8F-project-overview">🗺️ Project Overview</a>
      <ul>
        <li><a href="#-why-stasis">💡 Why STASIS?</a></li>
        <li><a href="#-tech-stack">📚 Tech Stack</a></li>
      </ul>
    </li>
    <li>
      <a href="#-getting-started">💻 Getting Started</a>
      <ul>
        <li><a href="#-prerequisites">🔧 Prerequisites</a></li>
        <li><a href="#%EF%B8%8F-installation">🛠️ Installation</a></li>
        <li><a href="#%EF%B8%8F-running-the-application">▶️ Running</a></li>
      </ul>
    </li>
    <li><a href="#-project-structure">🔎 Project Structure</a></li>
    <li><a href="#-contributing">📬 Contributing</a></li>
  </ol>
</details>

---

## 🗺️ Project Overview

**STASIS** is a **full-stack AI-powered adaptive learning web application** designed to improve study efficiency through intelligent flashcard generation, real-time emotion detection, and dynamic session adaptation.

The system combines **machine learning**, **natural language processing**, and **WebSocket-based real-time communication** to deliver a personalized and responsive study experience. STASIS detects the learner's emotional state via webcam, adjusts session difficulty and pacing in real time, and automatically generates flashcards from uploaded study materials using the Claude LLM API.

### 💡 Why STASIS?

Traditional study tools are static — they don't respond to how you're actually feeling or performing during a session. STASIS changes that by treating the study session as a live, adaptive loop.

- 🤖 **AI Flashcard Generation:** Upload PDF, DOCX, or TXT study materials and STASIS automatically generates question-and-answer flashcard pairs using the Claude LLM API (`claude-sonnet-4-6`). Flashcards are organized into decks tied to a learning topic.
- 🔁 **Spaced Repetition Engine:** Implements the SM-2 algorithm with quality ratings (again, hard, good, easy) to track each card's difficulty, review interval, and ease factor. Cards due for review are surfaced at the optimal time to maximize long-term memory retention.
- 😊 **Emotion-Aware Study Session:** A Pomodoro timer and live emotion detection run simultaneously and independently during every session. The webcam captures facial expressions in real time via `face-api.js` — detected emotion labels are streamed via Socket.io to the Adaptive Learning Engine. No webcam data or image frames are ever sent to the server.
- ⚡ **Smart Session Interventions:** When the Adaptive Learning Engine detects a sustained negative emotional state (sad, angry, disgusted, fearful) across 3 consecutive emotion frames, it triggers a lightweight in-session mood booster — a motivational meme or quote, a face challenge (e.g. make your biggest smile for 5 seconds, validated client-side by `face-api.js`), or a micro-celebration for answer streaks. The Pomodoro timer is never paused. Each intervention type has its own cooldown to prevent spam.
- 🧩 **Adaptive Learning Engine:** Continuously processes the emotion stream and session performance to personalize flashcard difficulty, pacing, and intervention timing in real time — calibrated from the learner's onboarding profile.
- 📴 **Offline-First Flashcard Review:** Download a full deck bundle to study without an internet connection. Card state changes made offline are queued locally in the browser and synced back to the backend on reconnect using timestamp-based last-write-wins conflict resolution. AI generation and emotion detection gracefully degrade when offline.
- 🔔 **Streak Reminder Notifications:** A cron job runs every 3 hours and sends a streak reminder email to users who haven't studied yet that day. Reminders stop automatically once a session is completed. Streaks use Duolingo-style local calendar date comparison — study before midnight in your local timezone to keep your streak alive.
- 📊 **Dashboard Analytics:** Gives learners a clear overview of progress including total flashcards created, current study streak, total decks, total topics, and a 7-day activity history.

### 📚 Tech Stack

<p align="left">
  <a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-2B2B2B?logo=nextdotjs&logoColor=white&style=flat" /></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat" /></a>
  <a href="https://expressjs.com/"><img alt="Express.js" src="https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white&style=flat" /></a>
  <a href="https://supabase.com"><img alt="Supabase" src="https://img.shields.io/badge/Supabase-269e6c?logo=supabase&logoColor=white&style=flat" /></a>
  <a href="https://www.postgresql.org/"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=flat" /></a>
  <a href="https://www.anthropic.com/"><img alt="Claude LLM" src="https://img.shields.io/badge/Claude_LLM-D97706?logo=anthropic&logoColor=white&style=flat" /></a>
  <a href="https://justadudewhohacks.github.io/face-api.js/"><img alt="face-api.js" src="https://img.shields.io/badge/face--api.js-E11D48?logo=javascript&logoColor=white&style=flat" /></a>
  <a href="https://socket.io/"><img alt="Socket.io" src="https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=white&style=flat" /></a>
  <a href="https://www.passportjs.org/"><img alt="Passport.js" src="https://img.shields.io/badge/Passport.js-34E27A?logo=passport&logoColor=white&style=flat" /></a>
  <a href="https://www.npmjs.com/package/node-cron"><img alt="node-cron" src="https://img.shields.io/badge/node--cron-339933?logo=node.js&logoColor=white&style=flat" /></a>
  <a href="https://nodemailer.com/"><img alt="Nodemailer" src="https://img.shields.io/badge/Nodemailer-22B8F0?logo=gmail&logoColor=white&style=flat" /></a>
  <a href="https://vercel.com/"><img alt="Vercel" src="https://img.shields.io/badge/Vercel-232323?logo=vercel&logoColor=white&style=flat" /></a>
  <a href="https://render.com/"><img alt="Render" src="https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=white&style=flat" /></a>
</p>

---

## 💻 Getting Started

Follow these steps to set up and run **STASIS** locally.

### 🔧 Prerequisites

- [Node.js](https://nodejs.org/) (version 20.0 or higher)
- [npm](https://www.npmjs.com/)
- [Supabase](https://supabase.com/) account and project
- [Anthropic API key](https://www.anthropic.com/)
- [Google OAuth credentials](https://console.cloud.google.com/)
- A configured email account for Nodemailer (e.g. Gmail with an app password)

### 🛠️ Installation

#### 1. Clone the Repository

```sh
git clone https://github.com/4Chronosx/stasis.git
cd stasis
```

#### 2. Install Backend Dependencies

```sh
cd backend
npm install
```

#### 3. Install Frontend Dependencies

```sh
cd ../frontend
npm install
```

#### 4. Environment Setup

**Backend:**
```sh
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (direct PostgreSQL connection)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
PG_SSL=true
PG_SSL_REJECT_UNAUTHORIZED=true

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# Anthropic
ANTHROPIC_API_KEY=

# Session
SESSION_SECRET=

# Email (Nodemailer)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Frontend
CLIENT_URL=http://localhost:3001
```

**Frontend:**
```sh
cd ../frontend
cp .env.example .env.local
```

#### 5. Run Database Migrations

```sh
cd backend
npx supabase db push --db-url your_database_url
```

> The `session` table used by `connect-pg-simple` is created automatically on first server start.

### ▶️ Running the Application

**Backend:**
```sh
cd backend
npm run dev
```

**Frontend** (in a separate terminal):
```sh
cd frontend
npm run dev
```

The backend runs on `http://localhost:3000` and the frontend on `http://localhost:3001`.

---

## 🔎 Project Structure

```
stasis/
├── frontend/                         # Next.js frontend
│   ├── app/                          # App Router pages
│   │   ├── (auth)/                   # Authentication routes
│   │   ├── dashboard/                # Analytics dashboard
│   │   ├── onboarding/               # Learner profile setup
│   │   ├── flashcards/               # Flashcard management
│   │   └── session/                  # Study session (Pomodoro + emotion)
│   ├── components/                   # React components
│   └── public/                       # Static assets
│
└── backend/                          # Express.js backend
    ├── src/
    │   ├── index.ts                  # Entry point — app config, middleware, routes, server
    │   ├── socket.ts                 # Socket.io server, in-memory emotion session management
    │   ├── config/
    │   │   ├── db.ts                 # PostgreSQL pool (pg) initialization
    │   │   └── env.ts                # Environment variable validation
    │   ├── middleware/
    │   │   ├── auth.middleware.ts    # Session verification, req.user attachment (401 if missing)
    │   │   ├── error.middleware.ts   # Global error handler — consistent JSON error responses
    │   │   └── rateLimiter.middleware.ts  # Global + stricter limits on upload and generate routes
    │   ├── types/
    │   │   └── index.ts              # Shared interfaces — AuthenticatedRequest, EmotionFrame,
    │   │                             # InterventionPayload, CardStateUpdate, AdaptiveParams
    │   └── modules/
    │       ├── auth/                 # Google OAuth via Passport.js, session persistence via connect-pg-simple
    │       ├── onboarding/           # 7-score learner profile quiz, adaptive_params computation
    │       ├── preferences/          # User preferences CRUD
    │       ├── materials/            # File upload via Multer — PDF (pdf-parse), DOCX (mammoth), TXT
    │       ├── flashcards/           # Topic + deck CRUD, Claude LLM generation, offline bundle endpoint
    │       ├── review/               # SM-2 spaced repetition, card state updates, offline sync endpoint
    │       ├── emotion/              # Socket.io event handlers, emotion buffer, intervention rule engine
    │       ├── adaptive/             # Difficulty recommendations
    │       ├── dashboard/            # Stats aggregation, 7-day activity history, streak logic
    │       ├── notifications/        # Streak reminder cron (node-cron + nodemailer, every 3 hours)
    │       └── settings/             # Timer, camera, notification settings
    └── supabase/
        └── migrations/               # Database migration files
```

---

## 📬 Contributing

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also open an issue with the tag "enhancement". Don't forget to give the project a star!

This project uses **Conventional Commits**. Instead of `git commit`, run:

```sh
npm run commit
```

This launches an interactive prompt that guides you to write a correctly formatted commit message.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`npm run commit`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📢 Contributors

<a href="https://github.com/4Chronosx/stasis/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=4Chronosx/stasis" alt="contrib.rocks image" />
</a>

---

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/4Chronosx/stasis.svg?style=for-the-badge
[contributors-url]: https://github.com/4Chronosx/stasis/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/4Chronosx/stasis.svg?style=for-the-badge
[forks-url]: https://github.com/4Chronosx/stasis/network/members
[stars-shield]: https://img.shields.io/github/stars/4Chronosx/stasis.svg?style=for-the-badge
[stars-url]: https://github.com/4Chronosx/stasis/stargazers
[issues-shield]: https://img.shields.io/github/issues/4Chronosx/stasis.svg?style=for-the-badge
[issues-url]: https://github.com/4Chronosx/stasis/issues