import { NextResponse } from 'next/server';
import { checkDbHealth } from '@/lib/mongodb';
import { readCampaigns } from '@/lib/db';
import { getSettings } from '@/lib/settings';

export async function GET() {
  try {
    const dbHealth = await checkDbHealth();
    let campaignsCount = 0;
    let settingsFound = false;

    if (dbHealth.connected) {
      try {
        const campaigns = await readCampaigns();
        campaignsCount = campaigns.length;
        const settings = await getSettings();
        settingsFound = Boolean(settings.senderEmail);
      } catch (e) {
        console.warn('[Health] Error reading initial campaign/settings counts:', e);
      }
    }

    return NextResponse.json({
      status: dbHealth.connected ? 'healthy' : 'degraded',
      service: 'AutoReach AI Full-Stack Platform',
      timestamp: new Date().toISOString(),
      database: {
        provider: 'MongoDB Atlas',
        connected: dbHealth.connected,
        latencyMs: dbHealth.latencyMs ?? null,
        databaseName: dbHealth.database,
        collections: dbHealth.collections || [],
        campaignsCount,
        settingsFound,
        error: dbHealth.error || null,
        fallbackMode: !dbHealth.connected
      }
    }, {
      status: dbHealth.connected ? 200 : 200 // Still return 200 with degraded state so client can display fallback badge
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal health check error';
    return NextResponse.json({
      status: 'error',
      database: {
        connected: false,
        error: message
      }
    }, { status: 500 });
  }
}
