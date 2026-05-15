import { Router } from 'express'
import { validateSchema } from '../../middleware/validator.middleware'
import * as sessionsController from './sessions.controller'
import { loadSessionSchema, submitSessionSchema } from './sessions.schema'

const router: Router = Router({ mergeParams: true })

router.get('/', validateSchema(loadSessionSchema), sessionsController.loadSession)
router.post('/', validateSchema(submitSessionSchema), sessionsController.submitSession)

export default router
