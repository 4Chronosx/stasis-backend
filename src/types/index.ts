export type SessionUser = {
	userId: string;
	email: string;
	name: string;
	pictureUrl: string;
};

export type AppSession = {
	user?: SessionUser;
};

export type EmotionSession = {
	buffer: string[];
};

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
