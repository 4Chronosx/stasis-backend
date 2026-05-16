import { Router } from "express";
import { authenticated, validateCsrf } from "../../middleware/auth.middleware";
import { completeOnboarding, getOnboardingStatus } from "./onboarding.controller";

const router: Router = Router();

router.get("/onboarding/status", authenticated, getOnboardingStatus);
router.post("/onboarding/complete", authenticated, validateCsrf, completeOnboarding);

export default router;
