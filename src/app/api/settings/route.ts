import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/settings';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const settings = await getSettings();
    // Mask sensitive key and password for display
    const maskedSettings = {
      ...settings,
      smtpPass: settings.smtpPass ? '••••••••' : '',
      hasSmtpPass: Boolean(settings.smtpPass && settings.smtpPass.trim().length > 0),
      openAiApiKey: settings.openAiApiKey
        ? `${settings.openAiApiKey.substring(0, 7)}...${settings.openAiApiKey.substring(settings.openAiApiKey.length - 4)}`
        : '',
      hasCustomKey: Boolean(settings.openAiApiKey && settings.openAiApiKey.trim().length > 10)
    };

    return NextResponse.json({ success: true, settings: maskedSettings });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();
    const isOnlyServices = Object.keys(body).length === 1 && 'services' in body;
    if (user && user.role !== 'admin' && !isOnlyServices) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role is required to modify system settings.' },
        { status: 403 }
      );
    }
    const current = await getSettings();

    // If user provided a masked key or empty, preserve existing if not explicitly changed
    if (body.openAiApiKey && body.openAiApiKey.includes('...')) {
      delete body.openAiApiKey;
    }

    // If user provided masked dots or empty string, preserve existing password
    if (body.smtpPass === '••••••••' || body.smtpPass === '' || body.smtpPass === undefined) {
      delete body.smtpPass;
    }

    const updated = await updateSettings({
      ...current,
      ...body
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        ...updated,
        smtpPass: updated.smtpPass ? '••••••••' : '',
        hasSmtpPass: Boolean(updated.smtpPass && updated.smtpPass.trim().length > 0),
        openAiApiKey: updated.openAiApiKey
          ? `${updated.openAiApiKey.substring(0, 7)}...${updated.openAiApiKey.substring(updated.openAiApiKey.length - 4)}`
          : '',
        hasCustomKey: Boolean(updated.openAiApiKey && updated.openAiApiKey.trim().length > 10)
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
