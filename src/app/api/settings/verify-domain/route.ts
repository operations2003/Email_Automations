import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import { verifyDomainDns, extractDomain } from '@/lib/dns-validator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = await getSettings();

    let domain = searchParams.get('domain');
    if (!domain) {
      domain = extractDomain(settings.senderEmail || 'tasknera.com');
    }

    const provider = (searchParams.get('provider') as any) || settings.provider || 'smtp';
    const report = await verifyDomainDns(domain, provider);

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'DNS verification failed.'
      },
      { status: 500 }
    );
  }
}
