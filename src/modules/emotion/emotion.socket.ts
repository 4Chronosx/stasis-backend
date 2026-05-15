import type { Server, Socket } from 'socket.io';
import { RATE_LIMITS } from '../../config/rateLimits';
import type { EmotionSession } from '../../types';

const MAX_BUFFER_LENGTH = 5;
const frameProfile = RATE_LIMITS.socket.emotionFrame;

const isFrameAllowed = (session: EmotionSession) => {
	if (!RATE_LIMITS.enabled || !frameProfile.enabled) {
		return true;
	}

	const now = Date.now();
	const windowStart = now - frameProfile.windowMs;
	session.frameTimestamps = session.frameTimestamps.filter((timestamp) => timestamp > windowStart);
	session.frameTimestamps.push(now);

	return session.frameTimestamps.length <= frameProfile.maxEvents;
};

export function registerEmotionHandlers(
  io: Server,
  socket: Socket,
  sessions: Map<string, EmotionSession>,
) {
  sessions.set(socket.id, {
    buffer: [],
    cooldowns: new Map<string, number>(),
    frameTimestamps: [],
    streak: 0,
  });

  socket.on('emotion:frame', (emotionLabel: unknown) => {
    if (typeof emotionLabel !== 'string') {
      socket.emit('emotion:error', { error: 'Emotion label must be a string.' });
      return;
    }

    const session = sessions.get(socket.id);
    if (!session) return;

    if (!isFrameAllowed(session)) {
      socket.emit('emotion:error', { error: frameProfile.message });
      return;
    }

    session.buffer.push(emotionLabel);

    if (session.buffer.length > MAX_BUFFER_LENGTH) {
      session.buffer.splice(0, session.buffer.length - MAX_BUFFER_LENGTH);
    }
  });

  socket.on('disconnect', () => {
    sessions.delete(socket.id);
  });

  void io;
}
