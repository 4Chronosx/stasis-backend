import { Router } from "express";
import { uploadPdf } from "../../middleware/upload.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import { authenticated, validateCsrf } from "../../middleware/auth.middleware";
import { createDeckSchema } from "./decks.schema";
import * as decksController from "./decks.controller";
import {
	aiGenerationAccountDayLimiter,
	aiGenerationAccountHourLimiter,
	aiGenerationConcurrencyLimiter,
	aiGenerationIpHourLimiter,
	deckDeleteHourLimiter,
	deckDeleteMinuteLimiter,
	deckReadLimiter,
} from "../../middleware/rateLimiter.middleware";

const router = Router();

router.use(authenticated);

router.get("/", deckReadLimiter, decksController.listDecks);
router.post(
	"/",
	aiGenerationIpHourLimiter,
	validateCsrf,
	aiGenerationAccountHourLimiter,
	aiGenerationAccountDayLimiter,
	aiGenerationConcurrencyLimiter,
	uploadPdf,
	validateSchema(createDeckSchema),
	decksController.createDeck,
);

router.get("/:id", deckReadLimiter, decksController.getDeck);
router.delete("/:id", validateCsrf, deckDeleteMinuteLimiter, deckDeleteHourLimiter, decksController.deleteDeck);

export default router;
