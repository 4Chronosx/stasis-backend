import { IncomingMessage, Server as HttpServer } from "node:http";

import { NextFunction, Request, RequestHandler, Response } from "express";
import { Server } from "socket.io";

import { env } from "./config/env";
import { EmotionSession } from "./types";
import { registerEmotionHandlers } from "./modules/emotion/emotion.socket";

type SocketSessionRequest = IncomingMessage & {
	session?: {
		user?: unknown;
	};
};

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
		io.engine.use((req: IncomingMessage, res: Response, next: NextFunction) => {
			sessionMiddleware(
				req as Request,
				res,
				next,
			);
		});
	}

	io.use((socket, next) => {
		const request = socket.request as SocketSessionRequest;

		if (!request.session?.user) {
			return next(new Error("Unauthorized"));
		}

		return next();
	});

	io.on("connection", (socket) => {
		registerEmotionHandlers(io, socket, emotionSessions);
	});

	return io;
};
