


import { pool } from "../../../config/db";

interface RefreshTokenRow {
    user_id: string;
    token: string;
    expires_at: Date;
}

export const RefreshTokenService = {
    create: async ({ userId, token, expiresAt }: { userId: string, token: string, expiresAt: Date }) => {
        await pool.query(
            `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
            [userId, token, expiresAt]
        );
    },

    find: async (token: string) => {
        const { rows } = await pool.query<RefreshTokenRow>(
            `SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > now()`,
            [token]
        );
        return rows[0] ?? null;
    },

    delete: async (token: string) => {
        await pool.query(
            `DELETE FROM refresh_tokens WHERE token = $1`,
            [token]
        );
    },

    deleteAllForUser: async (userId: string) => {
        await pool.query(
            `DELETE FROM refresh_tokens WHERE user_id = $1`,
            [userId]
        );
    }
}