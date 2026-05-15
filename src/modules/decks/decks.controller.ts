import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as decksService from "./decks.service";
import { CreateDeckBody, DeckIdParams } from "./decks.schema";

export async function createDeck(req: AuthRequest, res: Response) {
	try {
		const file = req.file;
		if (!file) {
			return res.status(400).json({ error: "PDF file is required" });
		}
		if (file.mimetype !== "application/pdf") {
			return res.status(400).json({ error: "Only PDF files are accepted" });
		}

		const body = req.body as CreateDeckBody;
		const userId = req.user!.userId;

		const result = await decksService.createDeck(
			file.buffer,
			body.cardCount,
			userId,
			body.name,
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