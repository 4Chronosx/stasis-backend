import { Request, Response } from 'express'
import * as sessionsService from './sessions.service'
import type { SessionParams, SubmitSessionBody } from './sessions.schema'

export async function loadSession(req: Request, res: Response) {
  const params = req.params as unknown as SessionParams
  const deckId = params.deckId

  const cards = await sessionsService.loadSession(deckId);
  res.json({ cards })
}

export async function submitSession(req: Request, res: Response) {
  const body = req.body as SubmitSessionBody
  const result = await sessionsService.submitSession(body.reviews);
  res.json(result);
}
