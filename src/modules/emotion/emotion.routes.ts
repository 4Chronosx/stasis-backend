import { Router } from 'express';
import { authenticated } from '../../middleware/auth.middleware';
import { snapshotRateLimiter } from '../../middleware/snapshotRateLimiter.middleware';
import * as emotionController from './emotion.controller';

const router: Router = Router();

router.use(authenticated);

router.post('/sessions/start', emotionController.startSession);
router.post('/sessions/:sessionId/data', snapshotRateLimiter, emotionController.addSnapshots);
router.post('/sessions/:sessionId/end', emotionController.endSession);
router.get('/sessions/:sessionId', emotionController.getSession);
router.delete('/sessions/:sessionId', emotionController.deleteSession);

router.get('/history', emotionController.listHistory);
router.get('/analytics/trends', emotionController.getTrends);

export default router;
