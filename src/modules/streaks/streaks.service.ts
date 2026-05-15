import type { PoolClient } from "pg";

import { db } from "../../config/db";

const DAILY_COMPLETION_TARGET = 10;

export interface StreakInfo {
	id: string;
	profileId: string;
	currentStreak: number;
	completedCards: number;
	remindUser: boolean;
}

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

export const recordCompletedCards = async (
	profileId: string,
	completedCount = 1
): Promise<StreakInfo> => {
	if (!Number.isInteger(completedCount) || completedCount <= 0) {
		throw new Error("completedCount must be a positive integer.");
	}

	const client = await db.connect();
	try {
		await client.query("BEGIN");
		await ensureStreakInfoForClient(client, profileId);

		const { rows } = await client.query<{
			completedCards: number;
			currentStreak: number;
		}>(
			`
			SELECT
				completed_cards AS "completedCards",
				current_streak AS "currentStreak"
			FROM streak_info
			WHERE profile_id = $1
			FOR UPDATE
			`,
			[profileId]
		);

		const current = rows[0];
		if (!current) {
			throw new Error("Streak info row not found.");
		}

		const nextCompletedCards = current.completedCards + completedCount;
		const completedDailyTarget =
			current.completedCards < DAILY_COMPLETION_TARGET &&
			nextCompletedCards >= DAILY_COMPLETION_TARGET;

		const nextCurrentStreak = completedDailyTarget
			? current.currentStreak + 1
			: current.currentStreak;
		const nextRemindUser = nextCompletedCards >= DAILY_COMPLETION_TARGET ? false : true;

		const result = await client.query<{
			id: string;
			profileId: string;
			currentStreak: number;
			completedCards: number;
			remindUser: boolean;
		}>(
			`
			UPDATE streak_info
			SET
				completed_cards = $2,
				current_streak = $3,
				remind_user = $4
			WHERE profile_id = $1
			RETURNING
				id,
				profile_id AS "profileId",
				current_streak AS "currentStreak",
				completed_cards AS "completedCards",
				remind_user AS "remindUser"
			`,
			[profileId, nextCompletedCards, nextCurrentStreak, nextRemindUser]
		);

		await client.query("COMMIT");

		const streakInfo = result.rows[0];
		if (!streakInfo) {
			throw new Error("Failed to update streak info.");
		}

		return mapStreakInfo(streakInfo);
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
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

const ensureStreakInfoForClient = async (client: PoolClient, profileId: string) => {
	await client.query(
		`
		INSERT INTO streak_info (profile_id)
		VALUES ($1)
		ON CONFLICT (profile_id) DO NOTHING
		`,
		[profileId]
	);
};
