import { Router } from "express";
import { uploadPdf } from "../../middleware/upload.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import { createDeckSchema } from "./decks.schema";
import * as decksController from "./decks.controller";

const router = Router();

router.get("/", decksController.listDecks);
router.post("/", uploadPdf, validateSchema(createDeckSchema), decksController.createDeck);
router.get("/:id", decksController.getDeck);
router.delete("/:id", decksController.deleteDeck);

export default router;