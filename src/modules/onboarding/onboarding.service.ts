import { z } from "zod";
import { db } from "../../config/db";
import { PreferencesService } from "../preferences/preferences.service";

const completeOnboardingSchema = z.object({
  privacy_comfort: z.enum(["visible", "hidden", "off"]).optional(),
  expression_tolerance: z.enum(["neutral", "intense", "variable"]).optional(),
  study_block_length: z.number().int().min(5).max(120).optional(),
  mini_breaks_per_session: z.number().int().min(1).max(10).optional(),
  recovery_duration: z.number().int().min(5).max(30).optional(),
  break_mechanic: z.enum(["relaxed", "accountable"]).optional(),
  show_timer: z.boolean().optional(),
});

export type CompleteOnboardingBody = z.infer<typeof completeOnboardingSchema>;

interface ValidationError {
  [key: string]: string;
}

export const OnboardingService = {
  validateOnboardingData(data: unknown): { valid: boolean; errors?: ValidationError } {
    const result = completeOnboardingSchema.safeParse(data);
    if (!result.success) {
      const errors: ValidationError = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path.join(".");
        errors[field] = issue.message;
      });
      return { valid: false, errors };
    }
    return { valid: true };
  },

  async completeOnboarding(
    userId: string,
    data: CompleteOnboardingBody
  ): Promise<{ success: boolean; message: string; errors?: ValidationError }> {
    try {
      // Ensure user preferences record exists
      await PreferencesService.ensureForUser(userId);

      // Build update query dynamically
      const fields: string[] = [];
      const values: unknown[] = [];
      let index = 1;

      const fieldMap: Record<string, boolean> = {
        privacy_comfort: !!data.privacy_comfort,
        expression_tolerance: !!data.expression_tolerance,
        study_block_length: data.study_block_length !== undefined,
        mini_breaks_per_session: data.mini_breaks_per_session !== undefined,
        recovery_duration: data.recovery_duration !== undefined,
        break_mechanic: !!data.break_mechanic,
        show_timer: data.show_timer !== undefined,
      };

      for (const [field, hasValue] of Object.entries(fieldMap)) {
        if (hasValue) {
          fields.push(`${field} = $${index}`);
          values.push((data as Record<string, unknown>)[field]);
          index++;
        }
      }

      fields.push(`onboarding_completed = TRUE`);
      fields.push(`onboarding_completed_at = NOW()`);
      fields.push(`updated_at = NOW()`);

      values.push(userId);

      if (fields.length > 3) {
        await db.query(
          `UPDATE user_preferences SET ${fields.join(", ")} WHERE user_id = $${index}`,
          values
        );
      } else {
        await db.query(
          `UPDATE user_preferences SET ${fields.join(", ")} WHERE user_id = $1`,
          [userId]
        );
      }

      return {
        success: true,
        message: "Onboarding completed successfully",
      };
    } catch (error) {
      console.error("[ONBOARDING] Service error:", error);
      return {
        success: false,
        message: "Failed to complete onboarding",
      };
    }
  },

  async getOnboardingStatus(userId: string): Promise<boolean> {
    try {
      return await PreferencesService.getCompletionStatus(userId);
    } catch (error) {
      console.error("[ONBOARDING] Get status error:", error);
      return false;
    }
  },
};
