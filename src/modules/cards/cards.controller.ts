import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as cardsService from "./cards.service";
import { CardParams, CreateCardBody, DeckIdParams, UpdateCardBody } from "./cards.schema";

export async function addCard(req: AuthRequest, res: Response) {
	const params = req.params as unknown as DeckIdParams;
	const deckId = params.deckId;
	const userId = req.user!.userId;

	// Body already validated by validateSchema middleware
	const body = req.body as CreateCardBody;

	const card = await cardsService.addCard(deckId, userId, body.front, body.back);
	if (!card) return res.status(404).json({ error: "Deck not found" });

	res.status(201).json(card);
}

export async function listCards(req: AuthRequest, res: Response) {
	const params = req.params as unknown as DeckIdParams;
	const deckId = params.deckId;
	const userId = req.user!.userId;

	const cards = await cardsService.listCards(deckId, userId);
	res.json(cards);
}

export async function updateCard(req: AuthRequest, res: Response) {
	const params = req.params as unknown as CardParams;
	const cardId = params.id;
	const userId = req.user!.userId;

	// Body already validated by validateSchema middleware
	const body = req.body as UpdateCardBody;

	const card = await cardsService.updateCard(cardId, params.deckId, userId, body.front, body.back);
	if (!card) return res.status(404).json({ error: "Card not found" });
	res.json(card);
}

export async function deleteCard(req: AuthRequest, res: Response) {
	const params = req.params as unknown as CardParams;
	const cardId = params.id;
	const userId = req.user!.userId;

	const deleted = await cardsService.deleteCard(cardId, params.deckId, userId);
	if (!deleted) return res.status(404).json({ error: "Card not found" });
	res.status(204).send();
}
