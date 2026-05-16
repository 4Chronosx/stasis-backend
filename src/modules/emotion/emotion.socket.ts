import type { Server, Socket } from 'socket.io';
import type { EmotionSession } from '../../types';
import * as InterventionMonitor from '../intervention/intervention.monitor';

const VALID_EMOTIONS = new Set(['focused', 'distracted', 'tired', 'confused', 'neutral']);
const VALID_GAZES    = new Set(['center', 'left', 'right', 'up', 'down', 'away', 'drifting']);

const ACTION_PRIORITY: Record<string, string> = {
  MEME_RESET:  'low',
  SHORT_BREAK: 'medium',
  LONG_BREAK:  'high',
};

type EmotionFrame = {
  sessionId:  string;
  timestamp:  number;
  emotion:    string;
  gaze:       string;
  confidence: number;
};

type FeedbackPayload = {
  interventionId: string;
  sessionId:      string;
  action:         string;
  outcome:        'dismissed' | 'completed' | 'extended';
  timestamp:      number;
};

export function registerEmotionHandlers(
  io:       Server,
  socket:   Socket,
  sessions: Map<string, EmotionSession>,
  userId:   string,
) {
  sessions.set(socket.id, { buffer: [] });

  socket.on('emotion:frame', (payload: unknown) => {
    if (!payload || typeof payload !== 'object') {
      socket.emit('emotion:error', { error: 'emotion:frame must be an object' });
      return;
    }

    const frame = payload as Partial<EmotionFrame>;

    if (typeof frame.sessionId !== 'string' || !frame.sessionId) {
      socket.emit('emotion:error', { error: 'sessionId is required' });
      return;
    }
    if (typeof frame.timestamp !== 'number') {
      socket.emit('emotion:error', { error: 'timestamp must be a number' });
      return;
    }

    const emotion    = VALID_EMOTIONS.has(frame.emotion ?? '') ? (frame.emotion as string) : 'neutral';
    const gaze       = VALID_GAZES.has(frame.gaze ?? '')       ? (frame.gaze as string)    : 'center';
    const confidence = typeof frame.confidence === 'number'    ? frame.confidence           : 1.0;

    // Keep legacy buffer
    const session = sessions.get(socket.id);
    if (session) {
      session.buffer.push(emotion);
      if (session.buffer.length > 5) session.buffer.splice(0, session.buffer.length - 5);
    }

    const trigger = InterventionMonitor.processFrame(userId, {
      emotion,
      gaze,
      confidence,
      timestamp: frame.timestamp,
      sessionId: frame.sessionId,
    });

    if (trigger) socket.emit('intervention:trigger', trigger);
  });

  socket.on('intervention:feedback', (payload: unknown) => {
    if (!payload || typeof payload !== 'object') return;
    const fb       = payload as Partial<FeedbackPayload>;
    const priority = typeof fb.action === 'string' ? ACTION_PRIORITY[fb.action] : undefined;
    if (priority && typeof fb.outcome === 'string') {
      InterventionMonitor.handleFeedback(userId, priority, fb.outcome);
    }
  });

  socket.on('disconnect', () => {
    sessions.delete(socket.id);
    InterventionMonitor.cleanup(userId);
  });

  void io;
}
