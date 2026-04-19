import { Pool } from "pg";

import { env } from "./env";

const sslConfig = env.PG_SSL ? { rejectUnauthorized: env.PG_SSL_REJECT_UNAUTHORIZED } : false;

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
	ssl: sslConfig,
});
