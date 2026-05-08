
import { Router } from 'express'
import * as decksController from './decks.controller'

const router = Router()

router.get('/',        decksController.listDecks)
router.post('/',       decksController.createDeck)
router.get('/:id',    decksController.getDeck)
router.delete('/:id', decksController.deleteDeck)

export default router