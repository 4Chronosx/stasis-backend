import { Router } from "express";
import { uploadFile } from "../../middleware/upload.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import { authenticated } from "../../middleware/auth.middleware";
import { createDeckSchema, deckIdSchema, updateDeckSchema } from "./decks.schema";
import * as decksController from "./decks.controller";
import { deckGenerationLimiter } from "../../middleware/rateLimiter.middleware";

const router: Router = Router();

router.use(authenticated);

router.get("/", decksController.listDecks);
router.post("/", deckGenerationLimiter, uploadFile, validateSchema(createDeckSchema), decksController.createDeck);

router.get("/:id", validateSchema(deckIdSchema), decksController.getDeck);
router.put("/:id", validateSchema(updateDeckSchema), decksController.updateDeck);
router.delete("/:id", validateSchema(deckIdSchema), decksController.deleteDeck);

export default router;
