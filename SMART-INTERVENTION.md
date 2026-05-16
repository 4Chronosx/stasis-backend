---

# STASIS — Intervention Layer Execution Plan
Assumes: Real-Time Emotion Pipeline is operational

---

## Overview

The Intervention Layer sits between the Real-Time Emotion Pipeline and the Client UI. It receives a rolling stream of emotion snapshots, detects behavioral patterns, decides on the appropriate intervention, and pushes that action back to the client — without disrupting the active Card Review Loop.

The Emotion Monitor runs in parallel throughout all 5 steps of the card cycle. It influences when the user studies, never which cards FSRS serves.

---

## Card Review Loop Integration

The 5-step cycle runs continuously. The Intervention Layer observes silently throughout:

1. Card Shown — FSRS serves the next due card
2. You Read It — emotion monitor captures baseline state in background
3. You Rate It — Again / Hard / Good / Easy; rating is correlated with emotion at review time
4. FSRS Updates Schedule — optimal next interval recalculated from rating
5. Next Time It's Due — card scheduled for long-term retention; loop restarts

The intervention layer only acts between steps — it never interrupts a card mid-read.

---

## Phase 1 — Inbound Data Contract

Socket.io event: emotion:frame

{
  "userId":     "abc123",
  "sessionId":  "sess_xyz",
  "timestamp":  1716000000,
  "emotion":    "Tired",      // Focused | Distracted | Tired | Confused | Neutral
  "gaze":       "Away",       // Center | Away | Drifting
  "confidence": 0.87
}

Validation rules:
- emotion must be one of the 5 valid states — drop unknown values
- confidence below 0.5 → treat as Neutral to avoid false triggers
- timestamp must be monotonically increasing per sessionId — reject stale frames
- Each valid frame is pushed into the per-user rolling window

---

## Phase 2 — Intervention Monitor (Rolling Window Analyzer)

Maintains a time-based rolling window of the last 60 seconds per user. Re-evaluates all pattern rules on each new frame.

Use time-based (60s), not frame-count-based — face-api.js frame rate varies by device, which would make frame-count windows inconsistent.


### Pattern Detection Rules

| Pattern | Detection Logic | Priority | Action |
|---|---|---|---|
| Mild distraction / low energy | Distracted or Tired > 20% of window | Low | Meme Reset |
| Sustained distraction | Distracted > 50% of window | Medium | Short Break |
| Fatigue / prolonged low focus | Tired > 60% of window | High | Long Break |
| High confusion rate | Confused > 40% of window | High | Long Break |
| Repeated gaze away | Away or Drifting > 50% of window | Medium | Short Break |

### Cooldown Logic
- Default: 5 minutes after any intervention fires
- Configurable per user via Intervention Settings
- Cooldown is per-pattern-category — a Meme Reset doesn't block a Short Break
- Dismissal resets the cooldown — same pattern can re-fire after the window passes

---

## Phase 3 — Smart Intervention Decision Engine

### Severity-to-Action Mapping
- Low → Meme Reset (non-disruptive mood boost overlay)
- Medium → Short Break (5-minute break prompt)
- High → Long Break (15–20 minute break prompt)

### Sensitivity Override
Fetched from User Profiles & Preferences on every decision cycle — takes effect immediately, no restart needed.

- High sensitivity — thresholds reduced 30% (fires sooner)
- Medium sensitivity — default thresholds apply
- Low sensitivity — thresholds increased 40% (requires longer pattern before firing)

---

## Phase 4 — Intervention Delivery

Socket.io event emitted to client: intervention:trigger

{
  "type":        "INTERVENTION",
  "action":      "SHORT_BREAK",   // MEME_RESET | SHORT_BREAK | LONG_BREAK
  "duration":    300,             // seconds
  "reason":      "Sustained distraction detected",
  "dismissible": true,
  "sessionId":   "sess_xyz"
}

### Client Behavior by Action
- MEME_RESET — Dismissible overlay, humor prompt. User continues immediately after dismiss. Session timer does not pause.
- SHORT_BREAK — Break screen with 5-minute countdown. Card queue pauses. Session state preserved.
- LONG_BREAK — Same as Short Break, 15–20 min countdown. Pomodoro timer resets after break completes.

### Session State — Must Be Saved Before Any Break Renders
- Current Card Position
- Review Queue State (FSRS due cards)
- Timer State (Pomodoro position)
- Emotional Context Snapshot (for analytics)

### Feedback Event — Client to Server

{
  "sessionId":  "sess_xyz",
  "action":     "SHORT_BREAK",
  "outcome":    "dismissed" | "completed" | "extended",
  "timestamp":  1716000300
}

---

## Phase 5 — Logging to Data & Storage Layer

Every intervention is written to Intervention Logs:

{
  "userId":           "abc123",
  "sessionId":        "sess_xyz",
  "triggeredAt":      1716000000,
  "patternDetected":  "Sustained distraction",
  "emotionAtTrigger": "Distracted",
  "gazeAtTrigger":    "Away",
  "actionTaken":      "SHORT_BREAK",
  "cardIdAtTrigger":  "card_789",
  "outcome":          "completed",
  "userSensitivity":  "medium",
  "cooldownApplied":  false
}

### Analytics Engine Feeds
- Focus Score Trend — ratio of Focused frames to total frames per session
- Emotion Breakdown Over Time — classification percentages per Pomodoro session
- Confusion Flags (Cards) — cards where Confused was dominant during review
- Streak Tracker — sessions with zero high-severity interventions contribute to streak
- Session Quality Score — composite: focus ratio, intervention count, break completion rate, card rating correlation

---

## Phase 6 — Intervention Settings API

PATCH /api/users/:userId/intervention-settings

{
  "sensitivity":  "low" | "medium" | "high",
  "breakLength":  5 | 15 | 20,
  "memeEnabled":  true | false,
  "cooldownMins": 5
}

200 OK — takes effect on next evaluation cycle

---

## End-to-End Execution Order

 1.  face-api.js analyzes webcam frame on-device
 2.  Emotion + gaze classified
 3.  Socket.io streams 'emotion:frame' to server
 4.  Monitor validates payload
 5.  Frame pushed into per-user 60s rolling window
 6.  Pattern rules evaluated across window
 7.  Cooldown gate checked — skip if recently fired
 8.  User sensitivity fetched from DB
 9.  Threshold adjusted for sensitivity level
10.  Intervention type selected
11.  'intervention:trigger' emitted to client
12.  Client saves session state, renders overlay
13.  User dismisses or completes break
14.  Client emits 'intervention:feedback' to server
15.  Intervention written to Intervention Logs
16.  Analytics Engine updated asynchronously
17.  Cooldown timer starts; session resumes

---

## Key Engineering Constraints

- Cooldown is non-negotiable — start at 5 min, make it configurable
- Rolling window must be time-based — not frame-count-based
- Pattern rules must be stateless functions over the window — easy to test and tune independently
- Decisions are server-side only — never let the client decide its own interventions
- Session state must be fully preserved before any break overlay renders
- Confidence < 0.5 → Neutral — never act on uncertain classification data
- Intervention Layer influences when, not which — FSRS queue is never touched