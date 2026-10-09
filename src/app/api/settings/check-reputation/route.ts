import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import { checkDomainReputation } from '@/lib/reputation-checker';
import { extractDomain } from '@/lib/dns-validator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = await getSettings();

    let domain = searchParams.get('domain');
    if (!domain) {
      domain = extractDomain(settings.senderEmail || 'tasknera.com');
    }

    const smtpHost = searchParams.get('smtpHost') || settings.smtpHost || 'smtp.gmail.com';
    const report = await checkDomainReputation(domain, smtpHost);

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Reputation check failed.'
      },
      { status: 500 }
    );
  }
}
