import { evaluatePatterns } from './intervention.rules';
import type { InterventionFrame } from './intervention.rules';

const WINDOW_DURATION_MS  = 60_000;
// Minimum elapsed time before any pattern is evaluated.
// Prevents firing on the very first few frames where ratios are meaningless.
const MIN_WINDOW_SPAN_MS  = 30_000;

export type InterventionSettings = {
  sensitivity:  'low' | 'medium' | 'high';
  breakLength:  number; // minutes — used for LONG_BREAK (15 | 20)
  memeEnabled:  boolean;
  cooldownMins: number;
};

const DEFAULT_SETTINGS: InterventionSettings = {
  sensitivity:  'medium',
  breakLength:  15,
  memeEnabled:  true,
  cooldownMins: 5,
};

const ACTION_DURATIONS: Record<string, number> = {
  MEME_RESET:  0,
  SHORT_BREAK: 300,
  LONG_BREAK:  900,
};

export type InterventionTrigger = {
  interventionId: string;
  type:           'INTERVENTION';
  action:         string;
  duration:       number;
  reason:         string;
  dismissible:    boolean;
  sessionId:      string;
};

type UserState = {
  frames:        InterventionFrame[];
  cooldowns:     Map<string, number>; // priority → expiry timestamp ms
  lastTimestamp: number;
  settings:      InterventionSettings;
};

const states = new Map<string, UserState>();

function getOrCreate(userId: string): UserState {
  if (!states.has(userId)) {
    states.set(userId, {
      frames:        [],
      cooldowns:     new Map(),
      lastTimestamp: 0,
      settings:      { ...DEFAULT_SETTINGS },
    });
  }
  return states.get(userId)!;
}

function pruneWindow(state: UserState, now: number): void {
  const cutoff = now - WINDOW_DURATION_MS;
  state.frames = state.frames.filter(f => f.timestamp > cutoff);
}

function calcDuration(action: string, settings: InterventionSettings): number {
  if (action === 'LONG_BREAK') return (settings.breakLength >= 15 ? settings.breakLength : 15) * 60;
  return ACTION_DURATIONS[action] ?? 300;
}

export function processFrame(
  userId: string,
  frame:  InterventionFrame & { sessionId: string },
): InterventionTrigger | null {
  const state = getOrCreate(userId);
  const now   = Date.now();

  // Reject stale frames — monotonically increasing per-user sequence
  if (frame.timestamp <= state.lastTimestamp) return null;
  state.lastTimestamp = frame.timestamp;

  state.frames.push({
    emotion:    frame.emotion,
    gaze:       frame.gaze,
    timestamp:  frame.timestamp,
    confidence: frame.confidence,
  });
  pruneWindow(state, now);

  // Don't evaluate until the window spans at least MIN_WINDOW_SPAN_MS.
  // A ratio over 3 frames is meaningless — wait for real data density.
  const firstFrame = state.frames[0];
  const windowSpan = state.frames.length >= 2 && firstFrame
    ? now - firstFrame.timestamp
    : 0;
  if (windowSpan < MIN_WINDOW_SPAN_MS) return null;

  const pattern = evaluatePatterns(state.frames, state.settings.sensitivity);
  if (!pattern) return null;

  if (pattern.action === 'MEME_RESET' && !state.settings.memeEnabled) return null;

  // Cooldown gate — per priority category
  const expiry = state.cooldowns.get(pattern.priority);
  if (expiry && now < expiry) return null;

  state.cooldowns.set(pattern.priority, now + state.settings.cooldownMins * 60_000);

  return {
    interventionId: `${userId}_${frame.sessionId}_${now}`,
    type:           'INTERVENTION',
    action:         pattern.action,
    duration:       calcDuration(pattern.action, state.settings),
    reason:         pattern.reason,
    dismissible:    true,
    sessionId:      frame.sessionId,
  };
}

export function handleFeedback(userId: string, priority: string, outcome: string): void {
  const state = states.get(userId);
  if (!state) return;

  // Always clear the window — the spec says "re-fire after the window passes",
  // meaning fresh data must accumulate before the same pattern can trigger again.
  state.frames = [];

  if (outcome === 'dismissed') {
    // Dismissed: clear cooldown so re-fire is gated only by the window rebuilding.
    state.cooldowns.delete(priority);
  }
  // 'completed': cooldown stays — user earned the full reprieve.
}

export function updateSettings(userId: string, partial: Partial<InterventionSettings>): InterventionSettings {
  const state = getOrCreate(userId);
  state.settings = { ...state.settings, ...partial };
  return state.settings;
}

export function getSettings(userId: string): InterventionSettings {
  return getOrCreate(userId).settings;
}

export function cleanup(userId: string): void {
  states.delete(userId);
}
