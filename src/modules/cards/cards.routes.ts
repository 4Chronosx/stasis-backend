import { Router } from 'express'
import * as cardsController from './cards.controller'

const router = Router({ mergeParams: true })  // mergeParams to access deckId

router.get('/',        cardsController.listCards)
router.post('/',       cardsController.addCard)
router.put('/:id',    cardsController.updateCard)
router.delete('/:id', cardsController.deleteCard)

export default router