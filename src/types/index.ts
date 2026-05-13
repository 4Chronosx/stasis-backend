export interface SessionUser {
	userId: string;
	email: string;
	name: string;
	pictureUrl: string;
}

export interface AppSession {
	user?: SessionUser;
}

export interface EmotionSession {
	buffer: string[];
	cooldowns: Map<string, number>;
	streak: number;
}

export class AppError extends Error {
	statusCode: number;

	constructor(message: string, statusCode = 500) {
		super(message);
		this.name = "AppError";
		this.statusCode = statusCode;
	}
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
	namespace Express {
		interface Request {
			session?: AppSession;
			user?: SessionUser;
		}
	}
}
/* eslint-enable @typescript-eslint/no-namespace */

export {};
