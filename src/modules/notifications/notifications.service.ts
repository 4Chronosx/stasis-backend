import nodemailer, { Transporter } from "nodemailer";

import { db } from "../../config/db";
import { env } from "../../config/env";
import { resetDailyStreaks } from "../streaks/streaks.service";

type ReminderUser = {
	id: string;
	email: string;
	fullName: string | null;
};

const resolveTransport = (): Transporter | null => {
	const host = env.SMTP_HOST;
	const user = env.SMTP_USER;
	const pass = env.SMTP_PASS;

	if (!host || !user || !pass) {
		return null;
	}

	const port = env.SMTP_PORT ?? 587;
	const secure = port === 465;

	return nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user, pass },
	});
};

const resolveFromAddress = (): string | null => {
	return env.SMTP_FROM ?? env.SMTP_USER ?? null;
};

const fetchUsersNeedingReminder = async (): Promise<ReminderUser[]> => {
	const { rows } = await db.query<ReminderUser>(
		`
		SELECT p.id, p.email, p.full_name AS "fullName"
		FROM profiles p
		INNER JOIN streak_info s ON s.profile_id = p.id
		WHERE s.remind_user = TRUE
		`
	);

	return rows;
};

const sendReminderEmail = async (transport: Transporter, from: string, user: ReminderUser) => {
	const displayName = user.fullName?.trim() || "there";
	const subject = "Don't break your streak!";
	const text = `Hi ${displayName},\n\nYou are close to losing your flashcard streak. Complete 10 flashcards before midnight to keep it going.\n\n- STASIS`;

	await transport.sendMail({
		from,
		to: user.email,
		subject,
		text,
	});
};

export const runStreakReminderJob = async () => {
	const transport = resolveTransport();
	const from = resolveFromAddress();

	if (!transport || !from) {
		console.warn("[CRON] SMTP is not configured. Skipping streak reminder run.");
		return;
	}

	const users = await fetchUsersNeedingReminder();

	for (const user of users) {
		try {
			await sendReminderEmail(transport, from, user);
		} catch (error) {
			console.error(
				`[CRON] Failed to send streak reminder to ${user.email}:`,
				error instanceof Error ? error.message : error
			);
		}
	}
};

export const runDailyStreakResetJob = async () => {
	await resetDailyStreaks();
};
