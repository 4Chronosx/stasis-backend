import nodemailer, { Transporter } from "nodemailer";

import { db } from "../../config/db";
import { env } from "../../config/env";

interface ReminderUser {
	id: string;
	email: string;
	fullName: string | null;
}

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
		SELECT id, email, full_name AS "fullName"
		FROM profiles
		WHERE (last_studied_date IS NULL OR last_studied_date <> CURRENT_DATE)
		  AND (streak_reminder_sent_date IS NULL OR streak_reminder_sent_date <> CURRENT_DATE)
		`
	);

	return rows;
};

const markReminderSent = async (userId: string) => {
	await db.query(
		`UPDATE profiles SET streak_reminder_sent_date = CURRENT_DATE WHERE id = $1`,
		[userId]
	);
};

const sendReminderEmail = async (transport: Transporter, from: string, user: ReminderUser) => {
	const displayName = user.fullName?.trim() || "there";
	const subject = "Don't break your streak!";
	const text = `Hi ${displayName},\n\nYou haven't studied today yet. Log in before midnight to keep your streak alive.\n\n- STASIS`;

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
			await markReminderSent(user.id);
		} catch (error) {
			console.error(
				`[CRON] Failed to send streak reminder to ${user.email}:`,
				error instanceof Error ? error.message : error
			);
		}
	}
};
