import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as decksService from "./decks.service";
import { CreateDeckBody, DeckIdParams, UpdateDeckBody } from "./decks.schema";

export async function createDeck(req: AuthRequest, res: Response) {
	try {
		const file = req.file;
		if (!file) {
			return res.status(400).json({ error: "File is required" });
		}

		const body = req.body as CreateDeckBody;
		const userId = req.user!.userId;

		const result = await decksService.createDeck(
			file.buffer,
			file.mimetype,
			body.cardCount,
			userId,
			body.name,
			body.description,
		);

		res.status(201).json(result);
	} catch (error) {
		console.error("[DECKS] createDeck failed:", error);
		const message = error instanceof Error ? error.message : "Failed to create deck";
		res.status(500).json({ error: message });
	}
}

export async function listDecks(req: AuthRequest, res: Response) {
	const userId = req.user!.userId;
	const decks = await decksService.listDecks(userId);
	res.json(decks);
}

export async function getDeck(req: AuthRequest, res: Response) {
	const params = req.params as unknown as DeckIdParams;
	const deckId = params.id;

	const userId = req.user!.userId;
	const deck = await decksService.getDeck(deckId, userId);
	if (!deck) return res.status(404).json({ error: "Deck not found" });
	res.json(deck);
}

export async function deleteDeck(req: AuthRequest, res: Response) {
	const params = req.params as unknown as DeckIdParams;
	const deckId = params.id;

	const userId = req.user!.userId;
	const deck = await decksService.getDeck(deckId, userId);
	if (!deck) return res.status(404).json({ error: "Deck not found" });

	await decksService.deleteDeck(deckId);
	res.status(204).send();
}

export async function updateDeck(req: AuthRequest, res: Response) {
	const params = req.params as unknown as DeckIdParams;
	const deckId = params.id;
	const body = req.body as UpdateDeckBody;

	const userId = req.user!.userId;
	const existing = await decksService.getDeck(deckId, userId);
	if (!existing) return res.status(404).json({ error: "Deck not found" });

	const updated = await decksService.updateDeck(
		deckId,
		body.name ?? existing.name,
		body.description ?? existing.description ?? "",
	);
	if (!updated) return res.status(404).json({ error: "Deck not found" });
	res.json(updated);
}