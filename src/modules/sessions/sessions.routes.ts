import { Router } from 'express'
import { validateSchema } from '../../middleware/validator.middleware'
import { authenticated } from '../../middleware/auth.middleware'
import * as sessionsController from './sessions.controller'
import { loadSessionSchema, submitSessionSchema } from './sessions.schema'

const router: Router = Router({ mergeParams: true })

router.use(authenticated)

router.get('/', validateSchema(loadSessionSchema), sessionsController.loadSession)
router.post('/', validateSchema(submitSessionSchema), sessionsController.submitSession)

export default router
