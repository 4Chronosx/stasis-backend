import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { OnboardingService, CompleteOnboardingBody } from "./onboarding.service";

export const getOnboardingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const onboarding_completed = await OnboardingService.getOnboardingStatus(userId);

    res.json({ onboarding_completed });
  } catch (error) {
    console.error("[ONBOARDING] GET status failed:", error);
    res.status(500).json({ error: "Failed to retrieve onboarding status" });
  }
};

export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data = req.body as CompleteOnboardingBody;

    // Validate input
    const validation = OnboardingService.validateOnboardingData(data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: validation.errors,
      });
    }

    const result = await OnboardingService.completeOnboarding(userId, data);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("[ONBOARDING] POST complete failed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
