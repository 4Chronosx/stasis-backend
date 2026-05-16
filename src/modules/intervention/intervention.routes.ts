import { Router, Response } from 'express';
import { authenticated } from '../../middleware/auth.middleware';
import type { AuthRequest } from '../../middleware/auth.middleware';
import * as monitor from './intervention.monitor';

const router = Router();

router.use(authenticated);

router.get('/settings', (req: AuthRequest, res: Response) => {
  res.json(monitor.getSettings(req.user!.userId));
});

router.patch('/settings', (req: AuthRequest, res: Response) => {
  const { sensitivity, breakLength, memeEnabled, cooldownMins } =
    req.body as Partial<monitor.InterventionSettings>;

  if (sensitivity !== undefined && !['low', 'medium', 'high'].includes(sensitivity)) {
    res.status(400).json({ message: 'sensitivity must be low | medium | high' });
    return;
  }
  if (breakLength !== undefined && ![5, 15, 20].includes(breakLength)) {
    res.status(400).json({ message: 'breakLength must be 5 | 15 | 20' });
    return;
  }
  if (cooldownMins !== undefined && (typeof cooldownMins !== 'number' || cooldownMins < 1)) {
    res.status(400).json({ message: 'cooldownMins must be a positive number' });
    return;
  }

  const patch: Partial<monitor.InterventionSettings> = {};
  if (sensitivity  !== undefined) patch.sensitivity  = sensitivity;
  if (breakLength  !== undefined) patch.breakLength  = breakLength;
  if (memeEnabled  !== undefined) patch.memeEnabled  = memeEnabled;
  if (cooldownMins !== undefined) patch.cooldownMins = cooldownMins;

  const updated = monitor.updateSettings(req.user!.userId, patch);
  res.json(updated);
});

export default router;
