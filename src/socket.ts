import { IncomingMessage, Server as HttpServer } from "node:http";

import { RequestHandler } from "express";
import { Server } from "socket.io";

import { env } from "./config/env";

export interface EmotionSession {
	buffer: string[];
	cooldowns: Map<string, number>;
	streak: number;
}

type SocketSessionRequest = IncomingMessage & {
	session?: {
		user?: unknown;
	};
};

const MAX_EMOTION_BUFFER_LENGTH = 5;

export const emotionSessions = new Map<string, EmotionSession>();

export const initializeSocket = (
	server: HttpServer,
	sessionMiddleware?: RequestHandler,
) => {
	const io = new Server(server, {
		cors: {
			origin: env.CLIENT_URL,
			credentials: true,
		},
	});

	if (sessionMiddleware) {
		io.engine.use(sessionMiddleware);
	}

	io.use((socket, next) => {
		const request = socket.request as SocketSessionRequest;

		if (!request.session?.user) {
			return next(new Error("Unauthorized"));
		}

		return next();
	});

	io.on("connection", (socket) => {
		emotionSessions.set(socket.id, {
			buffer: [],
			cooldowns: new Map<string, number>(),
			streak: 0,
		});

		socket.on("emotion:frame", (emotionLabel: unknown) => {
			if (typeof emotionLabel !== "string") {
				socket.emit("emotion:error", { error: "Emotion label must be a string." });
				return;
			}

			const emotionSession = emotionSessions.get(socket.id);

			if (!emotionSession) {
				return;
			}

			emotionSession.buffer.push(emotionLabel);

			if (emotionSession.buffer.length > MAX_EMOTION_BUFFER_LENGTH) {
				emotionSession.buffer.splice(
					0,
					emotionSession.buffer.length - MAX_EMOTION_BUFFER_LENGTH,
				);
			}
		});

		socket.on("disconnect", () => {
			emotionSessions.delete(socket.id);
		});
	});

	return io;
};
