import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import * as sessionsService from './sessions.service'
import type { SessionParams, SubmitSessionBody } from './sessions.schema'

export async function loadSession(req: AuthRequest, res: Response) {
  const params = req.params as unknown as SessionParams
  const deckId = params.deckId

  const cards = await sessionsService.loadSession(deckId);
  res.json({ cards })
}

export async function submitSession(req: AuthRequest, res: Response) {
  const body = req.body as SubmitSessionBody
  const profileId = req.user!.userId
  const result = await sessionsService.submitSession(body.reviews, profileId);
  res.json(result);
}
