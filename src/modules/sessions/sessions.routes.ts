import { Router } from 'express'
import * as sessionsController from './sessions.controller'

const router = Router({ mergeParams: true })

router.get('/', sessionsController.loadSession)
router.post('/', sessionsController.submitSession)

export default router
