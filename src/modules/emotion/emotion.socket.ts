import type { Server, Socket } from 'socket.io';
import type { EmotionSession } from '../../types';

const MAX_BUFFER_LENGTH = 5;

export function registerEmotionHandlers(
  io: Server,
  socket: Socket,
  sessions: Map<string, EmotionSession>,
) {
  sessions.set(socket.id, {
    buffer: [],
    cooldowns: new Map<string, number>(),
    streak: 0,
  });

  socket.on('emotion:frame', (emotionLabel: unknown) => {
    if (typeof emotionLabel !== 'string') {
      socket.emit('emotion:error', { error: 'Emotion label must be a string.' });
      return;
    }

    const session = sessions.get(socket.id);
    if (!session) return;

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
