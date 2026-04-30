import "dotenv/config";

type NodeEnv = "development" | "test" | "production";

type AppEnv = {
	PORT: number;
	NODE_ENV: NodeEnv;
	CLIENT_URL: string;
	DATABASE_URL: string | undefined;
	PG_SSL: boolean;
	PG_SSL_REJECT_UNAUTHORIZED: boolean;
	GOOGLE_CLIENT_ID: string | undefined;
	GOOGLE_CLIENT_SECRET: string | undefined;
	GOOGLE_CALLBACK_URL: string | undefined;
	ANTHROPIC_API_KEY: string | undefined;
	SESSION_SECRET: string | undefined;
	SMTP_HOST: string | undefined;
	SMTP_PORT: number | undefined;
	SMTP_USER: string | undefined;
	SMTP_PASS: string | undefined;
	SMTP_FROM: string | undefined;
};

const DEFAULT_PORT = 3000;
const DEFAULT_CLIENT_URL = "http://localhost:3001";

function getOptionalEnv(key: string): string | undefined {
	const value = process.env[key];

	if (!value) {
		return undefined;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function parsePort(rawPort: string | undefined): number {
	if (!rawPort) {
		return DEFAULT_PORT;
	}

	const parsedPort = Number(rawPort);
	const isInvalidPort =
		Number.isNaN(parsedPort) || !Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535;

	if (isInvalidPort) {
		throw new Error("Invalid PORT value. Expected an integer between 1 and 65535.");
	}

	return parsedPort;
}

function parseOptionalPort(rawPort: string | undefined): number | undefined {
	if (!rawPort) {
		return undefined;
	}

	const parsedPort = Number(rawPort);
	const isInvalidPort =
		Number.isNaN(parsedPort) || !Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535;

	if (isInvalidPort) {
		throw new Error("Invalid SMTP_PORT value. Expected an integer between 1 and 65535.");
	}

	return parsedPort;
}

function parseNodeEnv(rawNodeEnv: string | undefined): NodeEnv {
	if (!rawNodeEnv) {
		return "development";
	}

	if (rawNodeEnv === "development" || rawNodeEnv === "test" || rawNodeEnv === "production") {
		return rawNodeEnv;
	}

	throw new Error("Invalid NODE_ENV value. Expected one of: development, test, production.");
}

function parseBoolean(rawValue: string | undefined, defaultValue = false): boolean {
	if (rawValue === undefined) {
		return defaultValue;
	}

	return rawValue === "true";
}

export const env: AppEnv = Object.freeze({
	PORT: parsePort(getOptionalEnv("PORT")),
	NODE_ENV: parseNodeEnv(getOptionalEnv("NODE_ENV")),
	CLIENT_URL: getOptionalEnv("CLIENT_URL") ?? DEFAULT_CLIENT_URL,
	DATABASE_URL: getOptionalEnv("DATABASE_URL"),
	PG_SSL: parseBoolean(getOptionalEnv("PG_SSL")),
	PG_SSL_REJECT_UNAUTHORIZED: parseBoolean(getOptionalEnv("PG_SSL_REJECT_UNAUTHORIZED"), true),
	GOOGLE_CLIENT_ID: getOptionalEnv("GOOGLE_CLIENT_ID"),
	GOOGLE_CLIENT_SECRET: getOptionalEnv("GOOGLE_CLIENT_SECRET"),
	GOOGLE_CALLBACK_URL: getOptionalEnv("GOOGLE_CALLBACK_URL"),
	ANTHROPIC_API_KEY: getOptionalEnv("ANTHROPIC_API_KEY"),
	SESSION_SECRET: getOptionalEnv("SESSION_SECRET"),
	SMTP_HOST: getOptionalEnv("SMTP_HOST"),
	SMTP_PORT: parseOptionalPort(getOptionalEnv("SMTP_PORT")),
	SMTP_USER: getOptionalEnv("SMTP_USER"),
	SMTP_PASS: getOptionalEnv("SMTP_PASS"),
	SMTP_FROM: getOptionalEnv("SMTP_FROM"),
});

export const isProduction = env.NODE_ENV === "production";

export const isDevelopment = env.NODE_ENV === "development";

export function getRequiredEnv(key: keyof AppEnv): string {
	const value = env[key];

	if (typeof value === "string" && value.length > 0) {
		return value;
	}

	throw new Error(`Missing required environment variable: ${key}`);
}
