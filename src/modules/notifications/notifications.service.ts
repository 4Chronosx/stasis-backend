import { Resend } from "resend";

import { env } from "../../config/env";
import {
  fetchUsersForStreakRefresh,
  fetchUsersNeedingReminder,
  resetDailyStreaks,
  type StreakEmailUser,
} from "../streaks/streaks.service";

const resolveResendClient = (): Resend | null => {
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
};

const resolveFromAddress = (): string | null => {
  return env.RESEND_FROM ?? null;
};

const sendReminderEmail = async (client: Resend, from: string, user: StreakEmailUser) => {
  const displayName = user.fullName?.trim() || "there";
  const streak = user.currentStreak;
  const subject = `🔥 Don't lose your ${streak} day streak!`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f14;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#c4b5fd;font-weight:600;">STASIS</p>
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">🔥 Streak Alert</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <p style="margin:0 0 12px;font-size:16px;color:#a0a0c0;">Hi <strong style="color:#e2e2f0;">${displayName}</strong>,</p>

              <!-- Streak badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.2));border:1px solid rgba(124,58,237,0.4);border-radius:12px;padding:20px 36px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#a78bfa;">Current Streak</p>
                      <p style="margin:0;font-size:52px;font-weight:900;color:#7c3aed;line-height:1.1;">${streak}</p>
                      <p style="margin:4px 0 0;font-size:14px;color:#8b8baa;">days</p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:15px;color:#a0a0c0;line-height:1.7;">
                Don't lose your <strong style="color:#c4b5fd;">${streak} day streak!</strong>
                Complete your flashcards before midnight tonight to keep it alive. 💪
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                <tr>
                  <td align="center">
                    <a href="https://stasis-one.vercel.app/" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.5px;">
                      Study Now →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2a4a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#4a4a6a;">You're receiving this because streak reminders are enabled on your STASIS account.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await client.emails.send({ from, to: user.email, subject, html });

  if (error) {
    throw new Error(error.message);
  }
};

const sendStreakRefreshEmail = async (client: Resend, from: string, user: StreakEmailUser) => {
  const displayName = user.fullName?.trim() || "there";
  const streak = user.currentStreak;

  const streakLost = user.remindUser;

  const subject = streakLost
    ? "Daily Reset — Your streak has been reset"
    : `Daily Reset — You can now continue your ${streak} day streak!`;

  const headerGradient = streakLost ? "#dc2626,#b91c1c" : "#7c3aed,#4f46e5";
  const headerAccent = streakLost ? "#fca5a5" : "#c4b5fd";
  const accentColor = streakLost ? "#ef4444" : "#7c3aed";
  const badgeBorder = streakLost ? "rgba(220,38,38,0.4)" : "rgba(124,58,237,0.4)";
  const badgeBg = streakLost
    ? "rgba(220,38,38,0.15),rgba(185,28,28,0.15)"
    : "rgba(124,58,237,0.2),rgba(79,70,229,0.2)";

  const badgeLabel = streakLost ? "Streak Lost" : "Current Streak";
  const badgeValue = streakLost ? "0" : String(streak);
  const emoji = streakLost ? "💔" : "🔥";

  const bodyText = streakLost
    ? `Unfortunately, your streak has been reset. But don't worry — every champion starts from zero. Play again every day to build it back up! 🚀`
    : `Daily reset complete! You can now continue your <strong style="color:#c4b5fd;">${streak} day streak.</strong> Keep the momentum going — complete your flashcards today! ⚡`;

  const ctaLabel = streakLost ? "Start a New Streak →" : "Continue Streak →";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f14;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${headerGradient});padding:32px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:${headerAccent};font-weight:600;">STASIS</p>
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">${emoji} Daily Reset</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">

              <p style="margin:0 0 12px;font-size:16px;color:#a0a0c0;">Hi <strong style="color:#e2e2f0;">${displayName}</strong>,</p>

              <!-- Streak badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:linear-gradient(135deg,${badgeBg});border:1px solid ${badgeBorder};border-radius:12px;padding:20px 36px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${accentColor};">${badgeLabel}</p>
                      <p style="margin:0;font-size:52px;font-weight:900;color:${accentColor};line-height:1.1;">${badgeValue}</p>
                      <p style="margin:4px 0 0;font-size:14px;color:#8b8baa;">days</p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:15px;color:#a0a0c0;line-height:1.7;">${bodyText}</p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                <tr>
                  <td align="center">
                    <a href="https://stasis-one.vercel.app/" style="display:inline-block;background:linear-gradient(135deg,${headerGradient});color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.5px;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2a4a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#4a4a6a;">You're receiving this because you have a STASIS account.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await client.emails.send({ from, to: user.email, subject, html });

  if (error) {
    throw new Error(error.message);
  }
};

export const runStreakReminderJob = async () => {
  const client = resolveResendClient();
  const from = resolveFromAddress();

  if (!client || !from) {
    console.warn("[CRON] Resend is not configured. Skipping streak reminder run.");
    return;
  }

  const users = await fetchUsersNeedingReminder();

  for (const user of users) {
    try {
      await sendReminderEmail(client, from, user);
    } catch (error) {
      console.error(
        `[CRON] Failed to send streak reminder to ${user.email}:`,
        error instanceof Error ? error.message : error
      );
    }
  }
};

export const runDailyStreakResetJob = async () => {
  const client = resolveResendClient();
  const from = resolveFromAddress();

  const users = client && from ? await fetchUsersForStreakRefresh() : [];

  await resetDailyStreaks();

  if (!client || !from) {
    console.warn("[CRON] Resend is not configured. Skipping streak refresh email run.");
    return;
  }

  for (const user of users) {
    try {
      await sendStreakRefreshEmail(client, from, user);
    } catch (error) {
      console.error(
        `[CRON] Failed to send streak refresh email to ${user.email}:`,
        error instanceof Error ? error.message : error
      );
    }
  }
};
