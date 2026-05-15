import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { PreferencesService } from "../preferences/preferences.service";

export const getOnboardingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const completed = await PreferencesService.getCompletionStatus(userId);

    res.json({ completed });
  } catch (error) {
    console.error("[ONBOARDING] GET status failed:", error);
    res.status(500).json({ message: "Failed to retrieve onboarding status" });
  }
};

export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const preferences = await PreferencesService.markOnboardingCompleted(userId);

    if (!preferences) {
      return res.status(500).json({ message: "Failed to complete onboarding" });
    }

    res.json({ completed: preferences.onboarding_completed });
  } catch (error) {
    console.error("[ONBOARDING] POST complete failed:", error);
    res.status(500).json({ message: "Failed to complete onboarding" });
  }
};
