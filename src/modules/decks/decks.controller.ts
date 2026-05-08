import { Request, Response } from 'express'
import * as decksService from './decks.service'

type DeckBody = {
    name: string
}

const parseDeckBody = (value: unknown): DeckBody | null => {
    if (!value || typeof value !== 'object') return null
    const body = value as Record<string, unknown>
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return null
    return { name }
}

const parseIdParam = (value: unknown): number | null => {
    const raw = typeof value === 'string' || typeof value === 'number' ? Number(value) : Number.NaN
    return Number.isFinite(raw) ? raw : null
}

export async function createDeck(req: Request, res: Response) {
    const body = parseDeckBody(req.body as unknown)
    if (!body) return res.status(400).json({ error: 'name is required' });

    const deck = await decksService.createDeck(body.name);
    res.status(201).json(deck);
}

export async function listDecks(req: Request, res: Response) {
    const decks = await decksService.listDecks();
    res.json(decks);
}

export async function getDeck(req: Request, res: Response) {
    const params = req.params as { id?: string }
    const deckId = parseIdParam(params.id)
    if (deckId === null) return res.status(400).json({ error: 'invalid deck id' });

    const deck = await decksService.getDeck(deckId);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
    res.json(deck)
}

export async function deleteDeck(req: Request, res: Response) {
    const params = req.params as { id?: string }
    const deckId = parseIdParam(params.id)
    if (deckId === null) return res.status(400).json({ error: 'invalid deck id' });

    const deck = await decksService.getDeck(deckId);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    await decksService.deleteDeck(deckId);
    res.status(204).send();
}