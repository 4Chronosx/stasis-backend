import { Request, Response } from "express";
import * as decksService from "./decks.service";
import { CreateDeckBody } from "./decks.schema";

const parseIdParam = (value: unknown): number | null => {
	const raw = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
	return Number.isFinite(raw) ? raw : null;
};

export async function createDeck(req: Request, res: Response) {
	try {
		// File validation (cannot be done via Zod since it lives on req.file)
		const file = req.file;
		if (!file) {
			return res.status(400).json({ error: "PDF file is required" });
		}
		if (file.mimetype !== "application/pdf") {
			return res.status(400).json({ error: "Only PDF files are accepted" });
		}

		// Body already validated by validateSchema middleware
		const body = req.body as CreateDeckBody;

		const result = await decksService.createDeck(
			file.buffer,
			body.cardCount,
			body.name,
		);

		res.status(201).json(result);
	} catch (error) {
		console.error("[DECKS] createDeck failed:", error);
		const message = error instanceof Error ? error.message : "Failed to create deck";
		res.status(500).json({ error: message });
	}
}

export async function listDecks(_req: Request, res: Response) {
	const decks = await decksService.listDecks();
	res.json(decks);
}

export async function getDeck(req: Request, res: Response) {
	const params = req.params as { id?: string };
	const deckId = parseIdParam(params.id);
	if (deckId === null) return res.status(400).json({ error: "invalid deck id" });

	const deck = await decksService.getDeck(deckId);
	if (!deck) return res.status(404).json({ error: "Deck not found" });
	res.json(deck);
}

export async function deleteDeck(req: Request, res: Response) {
	const params = req.params as { id?: string };
	const deckId = parseIdParam(params.id);
	if (deckId === null) return res.status(400).json({ error: "invalid deck id" });

	const deck = await decksService.getDeck(deckId);
	if (!deck) return res.status(404).json({ error: "Deck not found" });

	await decksService.deleteDeck(deckId);
	res.status(204).send();
}