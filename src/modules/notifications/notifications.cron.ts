import cron from "node-cron";

import { runDailyStreakResetJob, runStreakReminderJob } from "./notifications.service";

let streakJobsStarted = false;
const STREAK_JOB_TIMEZONE = "Asia/Manila";

export const startStreakReminderJob = () => {
	if (streakJobsStarted) {
		return;
	}

	streakJobsStarted = true;

	cron.schedule(
		"0 21 * * *",
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
		"0 0 * * *",
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

	console.log("[CRON] Streak reminder scheduled: 0 21 * * * Asia/Manila");
	console.log("[CRON] Daily streak reset scheduled: 0 0 * * * Asia/Manila");
};
