import { Router } from "express";
import { authenticated, validateCsrf } from "../../middleware/auth.middleware";
import {
	cardReadLimiter,
	cardWriteHourLimiter,
	cardWriteMinuteLimiter,
} from "../../middleware/rateLimiter.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import { createCardSchema, updateCardSchema } from "./cards.schema";
import * as cardsController from "./cards.controller";

const router = Router({ mergeParams: true });

router.use(authenticated);

router.get("/", cardReadLimiter, cardsController.listCards);
router.post(
	"/",
	validateCsrf,
	cardWriteMinuteLimiter,
	cardWriteHourLimiter,
	validateSchema(createCardSchema),
	cardsController.addCard,
);

router.put(
	"/:id",
	validateCsrf,
	cardWriteMinuteLimiter,
	cardWriteHourLimiter,
	validateSchema(updateCardSchema),
	cardsController.updateCard,
);
router.delete("/:id", validateCsrf, cardWriteMinuteLimiter, cardWriteHourLimiter, cardsController.deleteCard);

export default router;
