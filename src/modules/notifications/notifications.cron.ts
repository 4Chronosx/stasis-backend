import cron from "node-cron";

import { runDailyStreakResetJob, runStreakReminderJob } from "./notifications.service";

let streakJobsStarted = false;
const STREAK_JOB_TIMEZONE = "Asia/Manila";
const STREAK_REMINDER_CRON = "0 21 * * *";
const DAILY_STREAK_RESET_CRON = "0 0 * * *";

export const startStreakReminderJob = () => {
	if (streakJobsStarted) {
		return;
	}

	streakJobsStarted = true;

	cron.schedule(
		STREAK_REMINDER_CRON,
		async () => {
			try {
				await runStreakReminderJob();
			} catch (error) {
				console.error(
					"[CRON] Streak reminder run failed:",
					error instanceof Error ? error.message : error
				);
			}
		},
		{ timezone: STREAK_JOB_TIMEZONE }
	);

	cron.schedule(
		DAILY_STREAK_RESET_CRON,
		async () => {
			try {
				await runDailyStreakResetJob();
			} catch (error) {
				console.error(
					"[CRON] Daily streak reset failed:",
					error instanceof Error ? error.message : error
				);
			}
		},
		{ timezone: STREAK_JOB_TIMEZONE }
	);

	console.log(`[CRON] Streak reminder scheduled: ${STREAK_REMINDER_CRON} ${STREAK_JOB_TIMEZONE}`);
	console.log(`[CRON] Daily streak reset scheduled: ${DAILY_STREAK_RESET_CRON} ${STREAK_JOB_TIMEZONE}`);
};
