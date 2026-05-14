import { Router } from "express";
import {
  getPreferences,
  createPreferences,
  updatePreferences,
  deletePreferences,
} from "./preferences.controller";
import { authenticated, validateCsrf } from "../../middleware/auth.middleware";
import {
  preferencesReadLimiter,
  preferencesWriteDayLimiter,
  preferencesWriteMinuteLimiter,
} from "../../middleware/rateLimiter.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import { createPreferencesSchema, updatePreferencesSchema } from "./preferences.schema";

const router = Router();

router.get("/preferences", authenticated, preferencesReadLimiter, getPreferences);
router.post(
  "/preferences",
  authenticated,
  validateCsrf,
  preferencesWriteMinuteLimiter,
  preferencesWriteDayLimiter,
  validateSchema(createPreferencesSchema),
  createPreferences,
);
router.patch(
  "/preferences",
  authenticated,
  validateCsrf,
  preferencesWriteMinuteLimiter,
  preferencesWriteDayLimiter,
  validateSchema(updatePreferencesSchema),
  updatePreferences,
);
router.delete(
  "/preferences",
  authenticated,
  validateCsrf,
  preferencesWriteMinuteLimiter,
  preferencesWriteDayLimiter,
  deletePreferences,
);

export default router;
