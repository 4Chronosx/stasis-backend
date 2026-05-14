import { Router } from 'express'
import { authenticated, validateCsrf } from '../../middleware/auth.middleware'
import {
  sessionLoadLimiter,
  sessionReviewRequestLimiter,
  sessionReviewVolumeLimiter,
} from '../../middleware/rateLimiter.middleware'
import * as sessionsController from './sessions.controller'

const router = Router({ mergeParams: true })

router.use(authenticated)

router.get('/', sessionLoadLimiter, sessionsController.loadSession)
router.post(
  '/',
  validateCsrf,
  sessionReviewRequestLimiter,
  sessionReviewVolumeLimiter,
  sessionsController.submitSession,
)

export default router
