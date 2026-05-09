import { Router } from "express";
import { validateSchema } from "../../middleware/validator.middleware";
import { createCardSchema, updateCardSchema } from "./cards.schema";
import * as cardsController from "./cards.controller";

const router = Router({ mergeParams: true }); // mergeParams to access deckId

router.get("/", cardsController.listCards);
router.post("/", validateSchema(createCardSchema), cardsController.addCard);
router.put("/:id", validateSchema(updateCardSchema), cardsController.updateCard);
router.delete("/:id", cardsController.deleteCard);

export default router;