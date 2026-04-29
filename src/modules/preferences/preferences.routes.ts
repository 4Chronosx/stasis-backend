import { Router } from "express";
import {
  getPreferences,
  createPreferences,
  updatePreferences,
  deletePreferences,
} from "./preferences.controller";
import { authenticated, validateCsrf } from "../../middleware/auth.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import { createPreferencesSchema, updatePreferencesSchema } from "./preferences.schema";

const router = Router();

router.get("/preferences", authenticated, getPreferences);
router.post("/preferences", authenticated, validateCsrf, validateSchema(createPreferencesSchema), createPreferences);
router.patch("/preferences", authenticated, validateCsrf, validateSchema(updatePreferencesSchema), updatePreferences);
router.delete("/preferences", authenticated, validateCsrf, deletePreferences);

export default router;
