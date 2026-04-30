import { Router } from "express";
import {
  getFlashcard,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
} from "./flashcards.controller";
import { authenticated, validateCsrf } from "../../middleware/auth.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import { createFlashcardSchema, updateFlashcardSchema, flashcardIdParamSchema } from "./flashcards.schema";

const router = Router();

router.get("/flashcards/:id", authenticated, validateSchema(flashcardIdParamSchema), getFlashcard);
router.post("/flashcards", authenticated, validateCsrf, validateSchema(createFlashcardSchema), createFlashcard);
router.patch("/flashcards/:id", authenticated, validateCsrf, validateSchema(updateFlashcardSchema), updateFlashcard);
router.delete("/flashcards/:id", authenticated, validateCsrf, validateSchema(flashcardIdParamSchema), deleteFlashcard);

export default router;
