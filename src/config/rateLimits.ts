type RateLimitMode = "enforce" | "monitor";

export interface LimiterSettings {
	enabled: boolean;
	windowMs: number;
	max: number;
}

interface AiRateLimitSettings {
	enabled: boolean;
	accountHour: LimiterSettings;
	accountDay: LimiterSettings;
	ipHour: LimiterSettings;
	concurrencyPerAccount: number;
}

interface SessionReviewRateLimitSettings {
	enabled: boolean;
	requestMinute: LimiterSettings;
	reviewHour: LimiterSettings;
	maxReviewsPerRequest: number;
}

interface RateLimitConfig {
	enabled: boolean;
	mode: RateLimitMode;
	trustProxyHops: number | undefined;
	trustedIps: string[];
	internalToken: string | undefined;
	global: LimiterSettings;
	public: LimiterSettings;
	docs: LimiterSettings;
	csrf: LimiterSettings;
	authUrlTenMinute: LimiterSettings;
	authUrlHour: LimiterSettings;
	oauthCallback: LimiterSettings;
	refreshTokenMinute: LimiterSettings;
	refreshIpFiveMinute: LimiterSettings;
	sessionPoll: LimiterSettings;
	logout: LimiterSettings;
	deckRead: LimiterSettings;
	deckDeleteMinute: LimiterSettings;
	deckDeleteHour: LimiterSettings;
	cardRead: LimiterSettings;
	cardWriteMinute: LimiterSettings;
	cardWriteHour: LimiterSettings;
	sessionLoad: LimiterSettings;
	preferencesRead: LimiterSettings;
	preferencesWriteMinute: LimiterSettings;
	preferencesWriteDay: LimiterSettings;
	ai: AiRateLimitSettings;
	sessionReviews: SessionReviewRateLimitSettings;
}

const minute = 60 * 1000;
const hour = 60 * minute;
const day = 24 * hour;

const getOptionalEnv = (key: string): string | undefined => {
	const value = process.env[key];
	if (!value) return undefined;

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

const parseBoolean = (key: string, defaultValue: boolean): boolean => {
	const value = getOptionalEnv(key);
	if (!value) return defaultValue;

	const normalized = value.toLowerCase();
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;

	console.warn(`[RATE_LIMIT] Invalid boolean for ${key}; using ${String(defaultValue)}.`);
	return defaultValue;
};

const parsePositiveInteger = (key: string, defaultValue: number): number => {
	const value = getOptionalEnv(key);
	if (!value) return defaultValue;

	const parsed = Number(value);
	if (Number.isInteger(parsed) && parsed > 0) return parsed;

	console.warn(`[RATE_LIMIT] Invalid positive integer for ${key}; using ${defaultValue}.`);
	return defaultValue;
};

const parseOptionalPositiveInteger = (key: string): number | undefined => {
	const value = getOptionalEnv(key);
	if (!value) return undefined;

	const parsed = Number(value);
	if (Number.isInteger(parsed) && parsed > 0) return parsed;

	console.warn(`[RATE_LIMIT] Invalid positive integer for ${key}; ignoring it.`);
	return undefined;
};

const parseMode = (): RateLimitMode => {
	const value = getOptionalEnv("RATE_LIMIT_MODE");
	if (!value) return "enforce";

	if (value === "enforce" || value === "monitor") return value;

	console.warn("[RATE_LIMIT] Invalid RATE_LIMIT_MODE; using enforce.");
	return "enforce";
};

const parseTrustedIps = (): string[] => {
	const value = getOptionalEnv("RATE_LIMIT_TRUSTED_IPS");
	if (!value) return [];

	return value
		.split(",")
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
};

const limiter = (
	enabledKey: string,
	maxKey: string,
	defaultMax: number,
	defaultWindowMs: number,
	windowMsKey?: string,
): LimiterSettings => ({
	enabled: parseBoolean(enabledKey, true),
	max: parsePositiveInteger(maxKey, defaultMax),
	windowMs: windowMsKey ? parsePositiveInteger(windowMsKey, defaultWindowMs) : defaultWindowMs,
});

export const rateLimitConfig: RateLimitConfig = {
	enabled: parseBoolean("RATE_LIMIT_ENABLED", true),
	mode: parseMode(),
	trustProxyHops: parseOptionalPositiveInteger("RATE_LIMIT_TRUST_PROXY_HOPS"),
	trustedIps: parseTrustedIps(),
	internalToken: getOptionalEnv("RATE_LIMIT_INTERNAL_TOKEN"),
	global: limiter(
		"RATE_LIMIT_GLOBAL_ENABLED",
		"RATE_LIMIT_GLOBAL_MAX_PER_15_MIN",
		300,
		15 * minute,
		"RATE_LIMIT_GLOBAL_WINDOW_MS",
	),
	public: limiter("RATE_LIMIT_PUBLIC_ENABLED", "RATE_LIMIT_PUBLIC_MAX_PER_MIN", 60, minute, "RATE_LIMIT_PUBLIC_WINDOW_MS"),
	docs: limiter("RATE_LIMIT_DOCS_ENABLED", "RATE_LIMIT_DOCS_MAX_PER_MIN", 60, minute, "RATE_LIMIT_DOCS_WINDOW_MS"),
	csrf: limiter("RATE_LIMIT_AUTH_ENABLED", "RATE_LIMIT_CSRF_MAX_PER_5_MIN", 60, 5 * minute, "RATE_LIMIT_CSRF_WINDOW_MS"),
	authUrlTenMinute: limiter(
		"RATE_LIMIT_AUTH_ENABLED",
		"RATE_LIMIT_AUTH_MAX_PER_10_MIN",
		20,
		10 * minute,
		"RATE_LIMIT_AUTH_10_MIN_WINDOW_MS",
	),
	authUrlHour: limiter("RATE_LIMIT_AUTH_ENABLED", "RATE_LIMIT_AUTH_MAX_PER_HOUR", 60, hour, "RATE_LIMIT_AUTH_HOUR_WINDOW_MS"),
	oauthCallback: limiter(
		"RATE_LIMIT_AUTH_ENABLED",
		"RATE_LIMIT_OAUTH_CALLBACK_MAX_PER_10_MIN",
		10,
		10 * minute,
		"RATE_LIMIT_OAUTH_CALLBACK_WINDOW_MS",
	),
	refreshTokenMinute: limiter(
		"RATE_LIMIT_AUTH_ENABLED",
		"RATE_LIMIT_REFRESH_MAX_PER_MIN",
		10,
		minute,
		"RATE_LIMIT_REFRESH_TOKEN_WINDOW_MS",
	),
	refreshIpFiveMinute: limiter(
		"RATE_LIMIT_AUTH_ENABLED",
		"RATE_LIMIT_REFRESH_IP_MAX_PER_5_MIN",
		60,
		5 * minute,
		"RATE_LIMIT_REFRESH_IP_WINDOW_MS",
	),
	sessionPoll: limiter(
		"RATE_LIMIT_AUTH_ENABLED",
		"RATE_LIMIT_SESSION_POLL_MAX_PER_MIN",
		120,
		minute,
		"RATE_LIMIT_SESSION_POLL_WINDOW_MS",
	),
	logout: limiter("RATE_LIMIT_AUTH_ENABLED", "RATE_LIMIT_LOGOUT_MAX_PER_MIN", 10, minute, "RATE_LIMIT_LOGOUT_WINDOW_MS"),
	deckRead: limiter("RATE_LIMIT_READS_ENABLED", "RATE_LIMIT_DECK_READ_MAX_PER_MIN", 120, minute, "RATE_LIMIT_DECK_READ_WINDOW_MS"),
	deckDeleteMinute: limiter(
		"RATE_LIMIT_WRITES_ENABLED",
		"RATE_LIMIT_DECK_DELETE_MAX_PER_MIN",
		5,
		minute,
		"RATE_LIMIT_DECK_DELETE_MINUTE_WINDOW_MS",
	),
	deckDeleteHour: limiter(
		"RATE_LIMIT_WRITES_ENABLED",
		"RATE_LIMIT_DECK_DELETE_MAX_PER_HOUR",
		20,
		hour,
		"RATE_LIMIT_DECK_DELETE_HOUR_WINDOW_MS",
	),
	cardRead: limiter("RATE_LIMIT_READS_ENABLED", "RATE_LIMIT_CARD_READ_MAX_PER_MIN", 60, minute, "RATE_LIMIT_CARD_READ_WINDOW_MS"),
	cardWriteMinute: limiter(
		"RATE_LIMIT_WRITES_ENABLED",
		"RATE_LIMIT_CARD_WRITE_MAX_PER_MIN",
		30,
		minute,
		"RATE_LIMIT_CARD_WRITE_MINUTE_WINDOW_MS",
	),
	cardWriteHour: limiter(
		"RATE_LIMIT_WRITES_ENABLED",
		"RATE_LIMIT_CARD_WRITE_MAX_PER_HOUR",
		300,
		hour,
		"RATE_LIMIT_CARD_WRITE_HOUR_WINDOW_MS",
	),
	sessionLoad: limiter(
		"RATE_LIMIT_READS_ENABLED",
		"RATE_LIMIT_SESSION_LOAD_MAX_PER_MIN",
		60,
		minute,
		"RATE_LIMIT_SESSION_LOAD_WINDOW_MS",
	),
	preferencesRead: limiter(
		"RATE_LIMIT_READS_ENABLED",
		"RATE_LIMIT_PREFERENCES_READ_MAX_PER_MIN",
		60,
		minute,
		"RATE_LIMIT_PREFERENCES_READ_WINDOW_MS",
	),
	preferencesWriteMinute: limiter(
		"RATE_LIMIT_WRITES_ENABLED",
		"RATE_LIMIT_PREFERENCES_WRITE_MAX_PER_MIN",
		10,
		minute,
		"RATE_LIMIT_PREFERENCES_WRITE_MINUTE_WINDOW_MS",
	),
	preferencesWriteDay: limiter(
		"RATE_LIMIT_WRITES_ENABLED",
		"RATE_LIMIT_PREFERENCES_WRITE_MAX_PER_DAY",
		100,
		day,
		"RATE_LIMIT_PREFERENCES_WRITE_DAY_WINDOW_MS",
	),
	ai: {
		enabled: parseBoolean("RATE_LIMIT_AI_ENABLED", true),
		accountHour: limiter("RATE_LIMIT_AI_ENABLED", "RATE_LIMIT_AI_MAX_PER_HOUR", 3, hour, "RATE_LIMIT_AI_HOUR_WINDOW_MS"),
		accountDay: limiter("RATE_LIMIT_AI_ENABLED", "RATE_LIMIT_AI_MAX_PER_DAY", 10, day, "RATE_LIMIT_AI_DAY_WINDOW_MS"),
		ipHour: limiter("RATE_LIMIT_AI_ENABLED", "RATE_LIMIT_AI_IP_MAX_PER_HOUR", 10, hour, "RATE_LIMIT_AI_IP_WINDOW_MS"),
		concurrencyPerAccount: parsePositiveInteger("RATE_LIMIT_AI_CONCURRENCY_PER_ACCOUNT", 1),
	},
	sessionReviews: {
		enabled: parseBoolean("RATE_LIMIT_SESSION_REVIEWS_ENABLED", true),
		requestMinute: limiter(
			"RATE_LIMIT_SESSION_REVIEWS_ENABLED",
			"RATE_LIMIT_SESSION_REVIEWS_MAX_PER_MIN",
			10,
			minute,
			"RATE_LIMIT_SESSION_REVIEWS_REQUEST_WINDOW_MS",
		),
		reviewHour: limiter(
			"RATE_LIMIT_SESSION_REVIEWS_ENABLED",
			"RATE_LIMIT_SESSION_REVIEW_EVENTS_MAX_PER_HOUR",
			2000,
			hour,
			"RATE_LIMIT_SESSION_REVIEW_EVENTS_WINDOW_MS",
		),
		maxReviewsPerRequest: parsePositiveInteger("RATE_LIMIT_SESSION_REVIEW_BATCH_MAX", 250),
	},
};

export const describeRateLimitConfig = () => ({
	enabled: rateLimitConfig.enabled,
	mode: rateLimitConfig.mode,
	trustProxyHops: rateLimitConfig.trustProxyHops ?? "default",
	trustedIpCount: rateLimitConfig.trustedIps.length,
	hasInternalToken: Boolean(rateLimitConfig.internalToken),
	global: rateLimitConfig.global,
	public: rateLimitConfig.public,
	docs: rateLimitConfig.docs,
	auth: {
		csrf: rateLimitConfig.csrf,
		authUrlTenMinute: rateLimitConfig.authUrlTenMinute,
		authUrlHour: rateLimitConfig.authUrlHour,
		oauthCallback: rateLimitConfig.oauthCallback,
		refreshTokenMinute: rateLimitConfig.refreshTokenMinute,
		refreshIpFiveMinute: rateLimitConfig.refreshIpFiveMinute,
		sessionPoll: rateLimitConfig.sessionPoll,
		logout: rateLimitConfig.logout,
	},
	reads: {
		deckRead: rateLimitConfig.deckRead,
		cardRead: rateLimitConfig.cardRead,
		sessionLoad: rateLimitConfig.sessionLoad,
		preferencesRead: rateLimitConfig.preferencesRead,
	},
	writes: {
		deckDeleteMinute: rateLimitConfig.deckDeleteMinute,
		deckDeleteHour: rateLimitConfig.deckDeleteHour,
		cardWriteMinute: rateLimitConfig.cardWriteMinute,
		cardWriteHour: rateLimitConfig.cardWriteHour,
		preferencesWriteMinute: rateLimitConfig.preferencesWriteMinute,
		preferencesWriteDay: rateLimitConfig.preferencesWriteDay,
	},
	ai: rateLimitConfig.ai,
	sessionReviews: rateLimitConfig.sessionReviews,
});
