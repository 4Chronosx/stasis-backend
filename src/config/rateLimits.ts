import { env } from "./env";

export type RateLimitKey = "ip" | "userOrIp" | "refreshTokenOrIp";

export type RateLimitProfile = {
	id: string;
	enabled: boolean;
	windowMs: number;
	maxRequests: number;
	key: RateLimitKey;
	message: string;
};

type SocketRateLimitProfile = {
	enabled: boolean;
	windowMs: number;
	maxEvents: number;
	message: string;
};

type RateLimitConfig = {
	enabled: boolean;
	http: Record<string, RateLimitProfile>;
	socket: {
		emotionFrame: SocketRateLimitProfile;
	};
};

const seconds = (value: number) => value * 1000;
const minutes = (value: number) => seconds(value * 60);
const hours = (value: number) => minutes(value * 60);

const enabled = env.RATE_LIMITS_ENABLED;

export const RATE_LIMITS = Object.freeze({
	enabled,
	http: {
		global: {
			id: "global",
			enabled,
			windowMs: minutes(1),
			maxRequests: 300,
			key: "ip",
			message: "Too many requests. Please slow down and try again shortly.",
		},
		authCsrf: {
			id: "auth:csrf",
			enabled,
			windowMs: minutes(10),
			maxRequests: 60,
			key: "ip",
			message: "Too many CSRF token requests. Please try again in a few minutes.",
		},
		authOAuthUrl: {
			id: "auth:oauth-url",
			enabled,
			windowMs: minutes(5),
			maxRequests: 20,
			key: "ip",
			message: "Too many sign-in attempts. Please wait a few minutes and try again.",
		},
		authOAuthCallback: {
			id: "auth:oauth-callback",
			enabled,
			windowMs: minutes(10),
			maxRequests: 30,
			key: "ip",
			message: "Too many OAuth callback attempts. Please wait before trying again.",
		},
		authRefresh: {
			id: "auth:refresh",
			enabled,
			windowMs: minutes(5),
			maxRequests: 30,
			key: "refreshTokenOrIp",
			message: "Too many token refresh attempts. Please try again shortly.",
		},
		authSessionRead: {
			id: "auth:session-read",
			enabled,
			windowMs: minutes(1),
			maxRequests: 120,
			key: "userOrIp",
			message: "Too many session checks. Please slow down.",
		},
		authLogout: {
			id: "auth:logout",
			enabled,
			windowMs: minutes(1),
			maxRequests: 20,
			key: "userOrIp",
			message: "Too many logout attempts. Please wait and try again.",
		},
		aiGenerateDeckIp: {
			id: "ai:generate-deck:ip",
			enabled,
			windowMs: hours(1),
			maxRequests: 60,
			key: "ip",
			message: "Too many deck generation requests from this network. Please try again later.",
		},
		aiGenerateDeckUserBurst: {
			id: "ai:generate-deck:user-burst",
			enabled,
			windowMs: minutes(15),
			maxRequests: 5,
			key: "userOrIp",
			message: "Too many deck generations. Please wait before generating more cards.",
		},
		aiGenerateDeckUserDaily: {
			id: "ai:generate-deck:user-daily",
			enabled,
			windowMs: hours(24),
			maxRequests: 30,
			key: "userOrIp",
			message: "Daily AI deck generation limit reached. Please try again tomorrow.",
		},
		deckMutation: {
			id: "deck:mutation",
			enabled,
			windowMs: minutes(1),
			maxRequests: 60,
			key: "userOrIp",
			message: "Too many deck changes. Please slow down.",
		},
		cardMutation: {
			id: "card:mutation",
			enabled,
			windowMs: minutes(1),
			maxRequests: 120,
			key: "userOrIp",
			message: "Too many card changes. Please slow down.",
		},
		sessionSubmit: {
			id: "session:submit",
			enabled,
			windowMs: minutes(1),
			maxRequests: 60,
			key: "userOrIp",
			message: "Too many study session submissions. Please slow down.",
		},
		emotionSessionStart: {
			id: "emotion:session-start",
			enabled,
			windowMs: hours(1),
			maxRequests: 30,
			key: "userOrIp",
			message: "Too many emotion sessions started. Please try again later.",
		},
		emotionSnapshotPost: {
			id: "emotion:snapshot-post",
			enabled,
			windowMs: seconds(10),
			maxRequests: 5,
			key: "userOrIp",
			message: "Too many snapshot submissions. Slow down batch frequency.",
		},
	},
	socket: {
		emotionFrame: {
			enabled,
			windowMs: seconds(10),
			maxEvents: 120,
			message: "Too many emotion frames. Slow down frame frequency.",
		},
	},
} satisfies RateLimitConfig);
