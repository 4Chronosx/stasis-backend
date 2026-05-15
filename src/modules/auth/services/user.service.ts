
import { db } from "../../../config/db"
import { ensureStreakInfo } from "../../streaks/streaks.service"

type ProfileRow = {
    id: string;
    fullname: string | null;
    email: string;
    pictureUrl: string | null;
};

type GoogleUser = {
    googleId: string,
    email: string,
    fullname: string,
    picture: string
};

export const UserService = {
    upsert: async (data: GoogleUser) => {
        const { rows } = await db.query<ProfileRow>(
            `
            INSERT INTO profiles (id, full_name, email, avatar_url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id)
            DO UPDATE SET
                full_name = EXCLUDED.full_name,
                email = EXCLUDED.email,
                avatar_url = EXCLUDED.avatar_url
            RETURNING id, full_name AS "fullname", email, avatar_url AS "pictureUrl"
            `,
            [data.googleId, data.fullname, data.email, data.picture]
        );
        const user = rows[0] ?? null;
        if (user) {
            await ensureStreakInfo(user.id);
        }

        return user;
    },

    findById: async (userId: string) => {
        const { rows } = await db.query<ProfileRow>(
            `SELECT id, full_name AS "fullname", email, avatar_url AS "pictureUrl" FROM profiles WHERE id = $1`,
            [userId]
        );
        return rows[0] ?? null;
    }
}
