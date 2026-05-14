import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as cardsService from "./cards.service";
import { CreateCardBody, UpdateCardBody } from "./cards.schema";

const parseIdParam = (value: unknown): number | null => {
	const raw = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
	return Number.isFinite(raw) ? raw : null;
};

export async function addCard(req: AuthRequest, res: Response) {
	const params = req.params as { deckId?: string };
	const deckId = parseIdParam(params.deckId);
	if (deckId === null) return res.status(400).json({ error: "invalid deckId" });

	// Body already validated by validateSchema middleware
	const body = req.body as CreateCardBody;
	const userId = req.user!.userId;

	const card = await cardsService.addCardForUser(deckId, userId, body.front, body.back);
	if (!card) return res.status(404).json({ error: "Deck not found" });
	res.status(201).json(card);
}

export async function listCards(req: AuthRequest, res: Response) {
	const params = req.params as { deckId?: string };
	const deckId = parseIdParam(params.deckId);
	if (deckId === null) return res.status(400).json({ error: "invalid deckId" });

	const userId = req.user!.userId;
	const cards = await cardsService.listCardsForUser(deckId, userId);
	res.json(cards);
}

export async function updateCard(req: AuthRequest, res: Response) {
	const params = req.params as { deckId?: string; id?: string };
	const deckId = parseIdParam(params.deckId);
	if (deckId === null) return res.status(400).json({ error: "invalid deckId" });

	const cardId = parseIdParam(params.id);
	if (cardId === null) return res.status(400).json({ error: "invalid card id" });

	// Body already validated by validateSchema middleware
	const body = req.body as UpdateCardBody;
	const userId = req.user!.userId;

	const card = await cardsService.updateCardForUser(deckId, cardId, userId, body.front, body.back);
	if (!card) return res.status(404).json({ error: "Card not found" });
	res.json(card);
}

export async function deleteCard(req: AuthRequest, res: Response) {
	const params = req.params as { deckId?: string; id?: string };
	const deckId = parseIdParam(params.deckId);
	if (deckId === null) return res.status(400).json({ error: "invalid deckId" });

	const cardId = parseIdParam(params.id);
	if (cardId === null) return res.status(400).json({ error: "invalid card id" });

	const userId = req.user!.userId;
	const deleted = await cardsService.deleteCardForUser(deckId, cardId, userId);
	if (!deleted) return res.status(404).json({ error: "Card not found" });

	res.status(204).send();
}
