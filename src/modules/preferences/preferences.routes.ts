import { Router } from "express";
import {
  completeRuntimeOnboarding,
  getRuntimePreferences,
  getPreferences,
  createPreferences,
  saveRuntimePreferences,
  updatePreferences,
  deletePreferences,
} from "./preferences.controller";
import { authenticated, validateCsrf } from "../../middleware/auth.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import {
  createPreferencesSchema,
  runtimePreferencesRequestSchema,
  updatePreferencesSchema,
} from "./preferences.schema";

const router: Router = Router();

router.use(authenticated);

router.get("/runtime", getRuntimePreferences);
router.put(
  "/runtime",
  validateCsrf,
  validateSchema(runtimePreferencesRequestSchema),
  saveRuntimePreferences
);
router.post(
  "/onboarding",
  validateCsrf,
  validateSchema(runtimePreferencesRequestSchema),
  completeRuntimeOnboarding
);

router.get("/", getPreferences);
router.post("/", validateCsrf, validateSchema(createPreferencesSchema), createPreferences);
router.patch("/", validateCsrf, validateSchema(updatePreferencesSchema), updatePreferences);
router.delete("/", validateCsrf, deletePreferences);

export default router;
