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

router.get("/", authenticated, getPreferences);
router.post("/", authenticated, validateCsrf, validateSchema(createPreferencesSchema), createPreferences);
router.patch("/", authenticated, validateCsrf, validateSchema(updatePreferencesSchema), updatePreferences);
router.delete("/", authenticated, validateCsrf, deletePreferences);

export default router;
