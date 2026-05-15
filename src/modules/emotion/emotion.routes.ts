import { Router } from 'express';
import { authenticated } from '../../middleware/auth.middleware';
import { emotionSessionStartRateLimiter } from '../../middleware/rateLimiter.middleware';
import { snapshotRateLimiter } from '../../middleware/snapshotRateLimiter.middleware';
import { validateSchema } from '../../middleware/validator.middleware';
import * as emotionController from './emotion.controller';
import {
	addSnapshotsSchema,
	deleteSessionSchema,
	endSessionSchema,
	getSessionSchema,
	getTrendsSchema,
	listHistorySchema,
	startSessionSchema,
} from './emotion.schema';

const router: Router = Router();

router.use(authenticated);

router.post('/sessions/start', emotionSessionStartRateLimiter, validateSchema(startSessionSchema), emotionController.startSession);
router.post(
	'/sessions/:sessionId/data',
	snapshotRateLimiter,
	validateSchema(addSnapshotsSchema),
	emotionController.addSnapshots,
);
router.post('/sessions/:sessionId/end', validateSchema(endSessionSchema), emotionController.endSession);
router.get('/sessions/:sessionId', validateSchema(getSessionSchema), emotionController.getSession);
router.delete('/sessions/:sessionId', validateSchema(deleteSessionSchema), emotionController.deleteSession);

router.get('/history', validateSchema(listHistorySchema), emotionController.listHistory);
router.get('/analytics/trends', validateSchema(getTrendsSchema), emotionController.getTrends);

export default router;
