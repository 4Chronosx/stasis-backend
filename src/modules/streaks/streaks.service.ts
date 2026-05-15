import { db } from "../../config/db";

export type StreakInfo = {
	id: string;
	profileId: string;
	currentStreak: number;
	completedCards: number;
	remindUser: boolean;
};

export type StreakEmailUser = {
	id: string;
	email: string;
	fullName: string | null;
	currentStreak: number;
	remindUser: boolean;
};

const mapStreakInfo = (row: {
	id: string;
	profileId: string;
	currentStreak: number;
	completedCards: number;
	remindUser: boolean;
}): StreakInfo => row;

export const ensureStreakInfo = async (profileId: string): Promise<StreakInfo> => {
	await db.query(
		`
		INSERT INTO streak_info (profile_id)
		VALUES ($1)
		ON CONFLICT (profile_id) DO NOTHING
		`,
		[profileId]
	);

	const { rows } = await db.query<{
		id: string;
		profileId: string;
		currentStreak: number;
		completedCards: number;
		remindUser: boolean;
	}>(
		`
		SELECT
			id,
			profile_id AS "profileId",
			current_streak AS "currentStreak",
			completed_cards AS "completedCards",
			remind_user AS "remindUser"
		FROM streak_info
		WHERE profile_id = $1
		`,
		[profileId]
	);

	const streakInfo = rows[0];
	if (!streakInfo) {
		throw new Error("Failed to create streak info row.");
	}

	return mapStreakInfo(streakInfo);
};

export const incrementCompletedCards = async (
	profileId: string,
	completedCount = 1
): Promise<StreakInfo> => {
	if (!Number.isInteger(completedCount) || completedCount <= 0) {
		throw new Error("completedCount must be a positive integer.");
	}

	await ensureStreakInfo(profileId);

	const { rows } = await db.query<{
		id: string;
		profileId: string;
		currentStreak: number;
		completedCards: number;
		remindUser: boolean;
	}>(
		`
		UPDATE streak_info
		SET
			completed_cards = LEAST(completed_cards + $2, 10),
			remind_user = LEAST(completed_cards + $2, 10) < 10
		WHERE profile_id = $1
		RETURNING
			id,
			profile_id AS "profileId",
			current_streak AS "currentStreak",
			completed_cards AS "completedCards",
			remind_user AS "remindUser"
		`,
		[profileId, completedCount]
	);

	const streakInfo = rows[0];
	if (!streakInfo) {
		throw new Error("Failed to update streak info.");
	}

	return mapStreakInfo(streakInfo);
};

export const fetchUsersNeedingReminder = async (): Promise<StreakEmailUser[]> => {
	const { rows } = await db.query<StreakEmailUser>(
		`
		SELECT
			p.id,
			p.email,
			p.full_name AS "fullName",
			s.current_streak AS "currentStreak",
			s.remind_user AS "remindUser"
		FROM profiles p
		INNER JOIN streak_info s ON s.profile_id = p.id
		WHERE s.remind_user = TRUE
		AND s.current_streak > 1
		`
	);

	return rows;
};

export const fetchUsersForStreakRefresh = async (): Promise<StreakEmailUser[]> => {
	const { rows } = await db.query<StreakEmailUser>(
		`
		SELECT
			p.id,
			p.email,
			p.full_name AS "fullName",
			s.current_streak AS "currentStreak",
			s.remind_user AS "remindUser"
		FROM profiles p
		INNER JOIN streak_info s ON s.profile_id = p.id
		`
	);

	return rows;
};

export const resetDailyStreaks = async () => {
	const client = await db.connect();
	try {
		await client.query("BEGIN");

		await client.query(
			`
			UPDATE streak_info
			SET
				current_streak = 0,
				completed_cards = 0,
				remind_user = TRUE
			WHERE remind_user = TRUE
			`
		);

		await client.query(
			`
			UPDATE streak_info
			SET
				completed_cards = 0,
				remind_user = TRUE
			WHERE remind_user = FALSE
			`
		);

		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

