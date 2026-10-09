import { NextRequest, NextResponse } from 'next/server';
import { getSuppressionList, addToSuppression, removeFromSuppression } from '@/lib/suppression';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const list = await getSuppressionList();
    return NextResponse.json({
      success: true,
      count: list.length,
      suppressions: list
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (user && user.role !== 'admin' && user.role !== 'employee') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { email, reason = 'manual', notes } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email is required.' }, { status: 400 });
    }

    await addToSuppression(email, reason, undefined, notes || 'Manually added via suppression manager');
    return NextResponse.json({
      success: true,
      message: `${email} added to suppression list.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (user && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Only admins can remove emails from suppression.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email query parameter required.' }, { status: 400 });
    }

    const removed = await removeFromSuppression(email);
    return NextResponse.json({
      success: true,
      removed,
      message: removed ? `${email} removed from suppression list.` : `${email} was not found.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
