import { Request, Response } from "express";
import * as cardsService from "./cards.service";
import { CardParams, CreateCardBody, DeckIdParams, UpdateCardBody } from "./cards.schema";

export async function addCard(req: Request, res: Response) {
	const params = req.params as unknown as DeckIdParams;
	const deckId = params.deckId;

	// Body already validated by validateSchema middleware
	const body = req.body as CreateCardBody;

	const card = await cardsService.addCard(deckId, body.front, body.back);
	res.status(201).json(card);
}

export async function listCards(req: Request, res: Response) {
	const params = req.params as unknown as DeckIdParams;
	const deckId = params.deckId;

	const cards = await cardsService.listCards(deckId);
	res.json(cards);
}

export async function updateCard(req: Request, res: Response) {
	const params = req.params as unknown as CardParams;
	const cardId = params.id;

	// Body already validated by validateSchema middleware
	const body = req.body as UpdateCardBody;

	const card = await cardsService.updateCard(cardId, body.front!, body.back!);
	if (!card) return res.status(404).json({ error: "Card not found" });
	res.json(card);
}

export async function deleteCard(req: Request, res: Response) {
	const params = req.params as unknown as CardParams;
	const cardId = params.id;

	const card = await cardsService.getCard(cardId);
	if (!card) return res.status(404).json({ error: "Card not found" });

	await cardsService.deleteCard(cardId);
	res.status(204).send();
}