import { Router, Request, Response } from 'express';
import { runDueFollowUps } from '../services/scheduler.js';

const router = Router();

router.all('/tick', async (_req: Request, res: Response) => {
  try {
    const report = await runDueFollowUps();
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
