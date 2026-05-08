import { Request, Response } from "express";
import * as cardsService from "./cards.service";
import { CreateCardBody, UpdateCardBody } from "./cards.schema";

const parseIdParam = (value: unknown): number | null => {
	const raw = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
	return Number.isFinite(raw) ? raw : null;
};

export async function addCard(req: Request, res: Response) {
	const params = req.params as { deckId?: string };
	const deckId = parseIdParam(params.deckId);
	if (deckId === null) return res.status(400).json({ error: "invalid deckId" });

	// Body already validated by validateSchema middleware
	const body = req.body as CreateCardBody;

	const card = await cardsService.addCard(deckId, body.front, body.back);
	res.status(201).json(card);
}

export async function listCards(req: Request, res: Response) {
	const params = req.params as { deckId?: string };
	const deckId = parseIdParam(params.deckId);
	if (deckId === null) return res.status(400).json({ error: "invalid deckId" });

	const cards = await cardsService.listCards(deckId);
	res.json(cards);
}

export async function updateCard(req: Request, res: Response) {
	const params = req.params as { id?: string };
	const cardId = parseIdParam(params.id);
	if (cardId === null) return res.status(400).json({ error: "invalid card id" });

	// Body already validated by validateSchema middleware
	const body = req.body as UpdateCardBody;

	const card = await cardsService.updateCard(cardId, body.front!, body.back!);
	if (!card) return res.status(404).json({ error: "Card not found" });
	res.json(card);
}

export async function deleteCard(req: Request, res: Response) {
	const params = req.params as { id?: string };
	const cardId = parseIdParam(params.id);
	if (cardId === null) return res.status(400).json({ error: "invalid card id" });

	const card = await cardsService.getCard(cardId);
	if (!card) return res.status(404).json({ error: "Card not found" });

	await cardsService.deleteCard(cardId);
	res.status(204).send();
}