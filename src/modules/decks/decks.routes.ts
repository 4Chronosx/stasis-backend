import { Router } from "express";
import { uploadPdf } from "../../middleware/upload.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import { authenticated } from "../../middleware/auth.middleware";
import { createDeckSchema } from "./decks.schema";
import * as decksController from "./decks.controller";

const router = Router();

router.use(authenticated);

/**
 * @openapi
 * /decks:
 *   get:
 *     summary: List all decks for the authenticated user
 *     tags:
 *       - Decks
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Array of decks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deck'
 *       "401":
 *         description: Unauthorized
 *   post:
 *     summary: Create a new deck from a PDF
 *     tags:
 *       - Decks
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to generate flashcards from
 *               name:
 *                 type: string
 *                 description: Deck name (AI-generated if omitted)
 *               cardCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
 *                 default: 10
 *                 description: Number of flashcards to generate
 *     responses:
 *       "201":
 *         description: Deck created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deck:
 *                   $ref: '#/components/schemas/Deck'
 *                 cards:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Card'
 *       "400":
 *         description: Missing or invalid PDF file
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
router.get("/", decksController.listDecks);
router.post("/", uploadPdf, validateSchema(createDeckSchema), decksController.createDeck);

/**
 * @openapi
 * /decks/{id}:
 *   get:
 *     summary: Get a deck by ID
 *     tags:
 *       - Decks
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Deck ID
 *     responses:
 *       "200":
 *         description: Deck found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deck'
 *       "400":
 *         description: Invalid deck ID
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Deck not found
 *   delete:
 *     summary: Delete a deck by ID
 *     tags:
 *       - Decks
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Deck ID
 *     responses:
 *       "204":
 *         description: Deck deleted successfully
 *       "400":
 *         description: Invalid deck ID
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Deck not found
 */
router.get("/:id", decksController.getDeck);
router.delete("/:id", decksController.deleteDeck);

export default router;