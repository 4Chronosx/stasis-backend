import { Router } from "express";
import { authenticated } from "../../middleware/auth.middleware";
import { cardMutationRateLimiter } from "../../middleware/rateLimiter.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import {
	createCardSchema,
	deleteCardSchema,
	listCardsSchema,
	updateCardSchema,
} from "./cards.schema";
import * as cardsController from "./cards.controller";

const router: Router = Router({ mergeParams: true });

router.use(authenticated);

router.get("/", validateSchema(listCardsSchema), cardsController.listCards);
router.post("/", cardMutationRateLimiter, validateSchema(createCardSchema), cardsController.addCard);

router.put("/:id", cardMutationRateLimiter, validateSchema(updateCardSchema), cardsController.updateCard);
router.delete("/:id", cardMutationRateLimiter, validateSchema(deleteCardSchema), cardsController.deleteCard);

export default router;
