import { Router, Request, Response } from 'express';
import { getSettings, updateSettings } from '../services/settings.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await getSettings();
    const maskedSettings = {
      ...settings,
      openAiApiKey: settings.openAiApiKey
        ? `${settings.openAiApiKey.substring(0, 7)}...${settings.openAiApiKey.substring(settings.openAiApiKey.length - 4)}`
        : '',
      hasCustomKey: Boolean(settings.openAiApiKey && settings.openAiApiKey.trim().length > 10)
    };
    res.json({ success: true, settings: maskedSettings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const current = await getSettings();

    if (body.openAiApiKey && body.openAiApiKey.includes('...')) {
      delete body.openAiApiKey;
    }

    const updated = await updateSettings({
      ...current,
      ...body
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        ...updated,
        openAiApiKey: updated.openAiApiKey
          ? `${updated.openAiApiKey.substring(0, 7)}...${updated.openAiApiKey.substring(updated.openAiApiKey.length - 4)}`
          : '',
        hasCustomKey: Boolean(updated.openAiApiKey && updated.openAiApiKey.trim().length > 10)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
