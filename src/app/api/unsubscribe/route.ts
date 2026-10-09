import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken, addToSuppression } from '@/lib/suppression';
import { findCampaignById, findCampaignByEmail, saveCampaign, addHistoryEvent } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const rawEmail = searchParams.get('email');
    const cid = searchParams.get('cid');

    let emailToUnsub = '';
    let campaignId = cid || '';

    if (token) {
      const verified = verifyUnsubscribeToken(token);
      if (verified.valid && verified.email) {
        emailToUnsub = verified.email;
        if (verified.campaignId) campaignId = verified.campaignId;
      }
    }

    if (!emailToUnsub && rawEmail && rawEmail.includes('@')) {
      emailToUnsub = rawEmail.trim().toLowerCase();
    }

    if (!emailToUnsub) {
      return NextResponse.redirect(new URL('/unsubscribe?error=invalid_token', req.url));
    }

    // 1. Add to permanent suppression list
    await addToSuppression(emailToUnsub, 'unsubscribed', campaignId, 'Recipient clicked email unsubscribe link');

    // 2. Halt campaign and update status
    let campaign = campaignId ? await findCampaignById(campaignId) : null;
    if (!campaign) {
      campaign = await findCampaignByEmail(emailToUnsub);
    }

    if (campaign) {
      const now = new Date().toISOString();
      campaign.status = 'Unsubscribed';
      campaign.replyStatus = 'Unsubscribed';
      campaign.lastActivity = 'Recipient opted out via one-click unsubscribe';
      campaign.lastActivityTimestamp = now;
      campaign.updatedAt = now;
      await saveCampaign(campaign);

      await addHistoryEvent(campaign.id, {
        type: 'unsubscribed',
        title: 'Recipient Opted Out (Unsubscribed)',
        description: `Recipient ${emailToUnsub} clicked unsubscribe. All future follow-ups permanently cancelled.`,
        timestamp: now
      });
    }

    // Return JSON if requested by programmatic client, else redirect to user-friendly confirmation page
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('application/json')) {
      return NextResponse.json({
        success: true,
        message: `Successfully unsubscribed ${emailToUnsub}. You will receive no further emails.`,
        email: emailToUnsub
      });
    }

    return NextResponse.redirect(new URL(`/unsubscribe?success=true&email=${encodeURIComponent(emailToUnsub)}`, req.url));
  } catch (error: any) {
    console.error('[Unsubscribe API] Error:', error);
    return NextResponse.redirect(new URL('/unsubscribe?error=server_error', req.url));
  }
}

/**
 * RFC 8058 One-Click Unsubscribe Handler
 * Invoked by Gmail and Yahoo when user clicks standard "Unsubscribe" header button
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    let emailToUnsub = '';
    let campaignId = '';

    if (token) {
      const verified = verifyUnsubscribeToken(token);
      if (verified.valid && verified.email) {
        emailToUnsub = verified.email;
        campaignId = verified.campaignId || '';
      }
    }

    if (!emailToUnsub) {
      const body = await req.json().catch(() => ({}));
      if (body.email && typeof body.email === 'string') {
        emailToUnsub = body.email.trim().toLowerCase();
        campaignId = body.campaignId || '';
      }
    }

    if (!emailToUnsub) {
      return NextResponse.json(
        { success: false, error: 'Valid unsubscribe token or email required' },
        { status: 400 }
      );
    }

    // Add to suppression
    await addToSuppression(emailToUnsub, 'unsubscribed', campaignId, 'RFC 8058 One-Click Header Unsubscribe');

    // Update campaign
    let campaign = campaignId ? await findCampaignById(campaignId) : null;
    if (!campaign) {
      campaign = await findCampaignByEmail(emailToUnsub);
    }

    if (campaign) {
      const now = new Date().toISOString();
      campaign.status = 'Unsubscribed';
      campaign.replyStatus = 'Unsubscribed';
      campaign.lastActivity = 'RFC 8058 One-click header unsubscribe received';
      campaign.lastActivityTimestamp = now;
      campaign.updatedAt = now;
      await saveCampaign(campaign);

      await addHistoryEvent(campaign.id, {
        type: 'unsubscribed',
        title: 'RFC 8058 One-Click Unsubscribe',
        description: `Mail client one-click header opt-out received for ${emailToUnsub}.`,
        timestamp: now
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
