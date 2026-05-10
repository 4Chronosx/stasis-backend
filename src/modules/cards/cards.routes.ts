import { Router } from "express";
import { validateSchema } from "../../middleware/validator.middleware";
import { createCardSchema, updateCardSchema } from "./cards.schema";
import * as cardsController from "./cards.controller";

const router = Router({ mergeParams: true }); // mergeParams to access deckId

/**
 * @openapi
 * /decks/{deckId}/cards:
 *   get:
 *     summary: List all cards in a deck
 *     tags:
 *       - Cards
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Array of cards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Card'
 *       "400":
 *         description: Invalid deckId
 *       "401":
 *         description: Unauthorized
 *   post:
 *     summary: Add a card to a deck
 *     tags:
 *       - Cards
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - front
 *               - back
 *             properties:
 *               front:
 *                 type: string
 *               back:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Card created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       "400":
 *         description: Invalid deckId or request body
 *       "401":
 *         description: Unauthorized
 */
router.get("/", cardsController.listCards);
router.post("/", validateSchema(createCardSchema), cardsController.addCard);

/**
 * @openapi
 * /decks/{deckId}/cards/{id}:
 *   put:
 *     summary: Update a card's front or back
 *     tags:
 *       - Cards
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               front:
 *                 type: string
 *               back:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Updated card
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       "400":
 *         description: Invalid card ID or request body
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Card not found
 *   delete:
 *     summary: Delete a card
 *     tags:
 *       - Cards
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "204":
 *         description: Card deleted
 *       "400":
 *         description: Invalid card ID
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Card not found
 */
router.put("/:id", validateSchema(updateCardSchema), cardsController.updateCard);
router.delete("/:id", cardsController.deleteCard);

export default router;