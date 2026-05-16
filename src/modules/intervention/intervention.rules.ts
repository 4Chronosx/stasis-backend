export type InterventionFrame = {
  emotion:    string;
  gaze:       string;
  timestamp:  number; // Unix ms
  confidence: number;
};

export type InterventionAction   = 'MEME_RESET' | 'SHORT_BREAK' | 'LONG_BREAK';
export type InterventionPriority = 'low' | 'medium' | 'high';

export type PatternResult = {
  pattern:  string;
  priority: InterventionPriority;
  action:   InterventionAction;
  reason:   string;
};

const BASE_THRESHOLDS = {
  mildDistraction:      0.20,
  sustainedDistraction: 0.50,
  fatigue:              0.60,
  highConfusion:        0.40,
  gazeAway:             0.50,
};

const SENSITIVITY_MULTIPLIERS: Record<string, number> = {
  high:   0.7,
  medium: 1.0,
  low:    1.4,
};

function applyConfidenceFilter(frames: InterventionFrame[]): InterventionFrame[] {
  return frames.map(f => ({
    ...f,
    emotion: f.confidence < 0.5 ? 'neutral' : f.emotion,
  }));
}

function ratio(frames: InterventionFrame[], pred: (f: InterventionFrame) => boolean): number {
  if (frames.length === 0) return 0;
  return frames.filter(pred).length / frames.length;
}

export function evaluatePatterns(
  rawFrames: InterventionFrame[],
  sensitivity = 'medium',
): PatternResult | null {
  if (rawFrames.length === 0) return null;

  const frames = applyConfidenceFilter(rawFrames);
  const m      = SENSITIVITY_MULTIPLIERS[sensitivity] ?? 1.0;

  const t = {
    mildDistraction:      BASE_THRESHOLDS.mildDistraction      * m,
    sustainedDistraction: BASE_THRESHOLDS.sustainedDistraction * m,
    fatigue:              BASE_THRESHOLDS.fatigue               * m,
    highConfusion:        BASE_THRESHOLDS.highConfusion         * m,
    gazeAway:             BASE_THRESHOLDS.gazeAway              * m,
  };

  // High priority first
  if (ratio(frames, f => f.emotion === 'tired') > t.fatigue)
    return { pattern: 'Fatigue / prolonged low focus', priority: 'high', action: 'LONG_BREAK', reason: 'Fatigue detected' };

  if (ratio(frames, f => f.emotion === 'confused') > t.highConfusion)
    return { pattern: 'High confusion rate', priority: 'high', action: 'LONG_BREAK', reason: 'High confusion rate detected' };

  // Medium priority
  if (ratio(frames, f => f.emotion === 'distracted') > t.sustainedDistraction)
    return { pattern: 'Sustained distraction', priority: 'medium', action: 'SHORT_BREAK', reason: 'Sustained distraction detected' };

  if (ratio(frames, f => f.gaze === 'away' || f.gaze === 'drifting') > t.gazeAway)
    return { pattern: 'Repeated gaze away', priority: 'medium', action: 'SHORT_BREAK', reason: 'Repeated gaze away detected' };

  // Low priority
  if (ratio(frames, f => f.emotion === 'distracted' || f.emotion === 'tired') > t.mildDistraction)
    return { pattern: 'Mild distraction / low energy', priority: 'low', action: 'MEME_RESET', reason: 'Mild distraction or low energy detected' };

  return null;
}
