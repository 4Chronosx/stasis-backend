import { Router } from "express";
import { validateSchema } from "../../middleware/validator.middleware";
import {
	createCardSchema,
	deleteCardSchema,
	listCardsSchema,
	updateCardSchema,
} from "./cards.schema";
import * as cardsController from "./cards.controller";
import { editCardLimiter } from "../../middleware/rateLimiter.middleware";

const router: Router = Router({ mergeParams: true });

router.get("/", validateSchema(listCardsSchema), cardsController.listCards);
router.post("/", validateSchema(createCardSchema), cardsController.addCard);

router.put("/:id", editCardLimiter, validateSchema(updateCardSchema), cardsController.updateCard);
router.delete("/:id", validateSchema(deleteCardSchema), cardsController.deleteCard);

export default router;
