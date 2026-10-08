import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import { sendOutreachEmail } from '@/lib/email-service';
import { AppSettings } from '@/types/outreach';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetEmail = body.to;
    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: 'Recipient test email address is required.' },
        { status: 400 }
      );
    }

    const currentSettings = await getSettings();
    // Allow overriding with transient unsaved settings from the form
    const effectiveSettings: AppSettings = {
      ...currentSettings,
      ...(body.settingsOverride || {})
    };

    if (effectiveSettings.provider === 'simulated') {
      return NextResponse.json({
        success: true,
        message: 'Sandbox simulation test passed! (Note: Provider is set to Simulated Sandbox, so no actual internet email was dispatched).',
        provider: 'simulated_sandbox'
      });
    }

    const result = await sendOutreachEmail(
      {
        to: targetEmail,
        subject: `[Test] AutoReach AI Email Delivery Test (${effectiveSettings.provider.toUpperCase()})`,
        body: `Hello,\n\nThis is a test email sent from AutoReach AI to confirm that your email dispatch settings (${effectiveSettings.provider}) are working properly.\n\nTimestamp: ${new Date().toLocaleString()}`,
        signature: effectiveSettings.emailSignature,
        campaignId: 'test_dispatch',
        stage: 'initial'
      },
      effectiveSettings
    );

    return NextResponse.json({
      success: true,
      message: `Test email successfully dispatched to ${targetEmail} via ${result.provider}! Check your inbox.`,
      result
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to send test email'
      },
      { status: 500 }
    );
  }
}
