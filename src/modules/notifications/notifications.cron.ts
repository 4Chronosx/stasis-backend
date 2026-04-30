import cron from "node-cron";

import { runStreakReminderJob } from "./notifications.service";

let streakReminderStarted = false;

export const startStreakReminderJob = () => {
	if (streakReminderStarted) {
		return;
	}

	streakReminderStarted = true;

	cron.schedule("0 */3 * * *", async () => {
		try {
			await runStreakReminderJob();
		} catch (error) {
			console.error(
				"[CRON] Streak reminder run failed:",
				error instanceof Error ? error.message : error
			);
		}
	});

	console.log("[CRON] Streak reminder scheduled: 0 */3 * * *");
};
