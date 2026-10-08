import { NextResponse } from 'next/server';
import { runDueFollowUps } from '@/lib/scheduler';

export async function POST() {
  try {
    const report = await runDueFollowUps();
    return NextResponse.json({ success: true, report });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // Allow simple GET requests for health check or cron pings
  try {
    const report = await runDueFollowUps();
    return NextResponse.json({ success: true, report });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
