import { NextRequest, NextResponse } from 'next/server';
import { processIncomingEmail } from '@/lib/inbox-engine';
import { Department, DEPARTMENTS } from '@/types/inbox';

export const SIMULATION_PRESETS: Record<
  string,
  {
    name: string;
    department: Department;
    from: string;
    fromName: string;
    subject: string;
    text: string;
  }
> = {
  operations_partnership: {
    name: 'Operations — Enterprise Partnership Inquiry',
    department: 'operations',
    from: 'alex.morgan@novapartner.io',
    fromName: 'Alex Morgan',
    subject: 'Partnership Inquiry: Automation workflows for Q4',
    text: `Hi TaskNera Team,

We are exploring a strategic automation partnership for our enterprise clients in North America. Could you share your operational capabilities and schedule a brief call this week?

Best regards,
Alex Morgan
VP of Strategic Partnerships, NovaPartner`
  },
  careers_application: {
    name: 'Careers — Senior Full-Stack Engineer Application',
    department: 'careers',
    from: 'priya.sharma@engineermail.com',
    fromName: 'Priya Sharma',
    subject: 'Application: Senior Full-Stack Engineer - Priya Sharma',
    text: `Dear TaskNera Talent Acquisition,

I would love to be considered for the Senior Full-Stack Engineer role at TaskNera Solutions. I have 6+ years of experience in Next.js, Node.js, and cloud backend architecture. 

Attached is my portfolio and resume link for your review: https://priyasharma.dev/cv

Thank you,
Priya Sharma`
  },
  hr_inquiry: {
    name: 'HR — Benefits and Verification Inquiry',
    department: 'hr',
    from: 'corporate.services@partnergroup.com',
    fromName: 'Marcus Vance',
    subject: 'Employment Verification Request - Department Inquiry',
    text: `Hello TaskNera People Operations,

We are processing an official employment verification request regarding a former team member. Please confirm the appropriate point of contact and documentation checklist for HR clearance.

Thank you,
Marcus Vance
Corporate Services`
  },
  recruitment_partnership: {
    name: 'Recruitment — Executive Staffing Proposal',
    department: 'recruitment',
    from: 'claire.bennett@apexrecruiting.co',
    fromName: 'Claire Bennett',
    subject: 'Recruitment Partnership — Technical Talent Pipeline',
    text: `Hi Team,

Apex Recruiting specializes in senior engineering and product leadership placements. We would like to introduce our contingency sourcing model to TaskNera's talent leaders.

Are you available for a 15-minute briefing next Tuesday?

Kind regards,
Claire Bennett`
  },
  support_ticket: {
    name: 'Support — Webhook Delivery Timeout Help',
    department: 'support',
    from: 'david.chen@clientbrand.com',
    fromName: 'David Chen',
    subject: 'Issue: Webhook integration returning 504 timeout',
    text: `Hi Support Team,

Our production integration with your API endpoint encountered multiple 504 timeouts at 11:20 AM UTC today. 

Could your engineering team check the upstream server status and assist us in diagnosing the request logs?

Thanks,
David Chen
DevOps Lead, ClientBrand`
  },
  spam_automated: {
    name: 'Spam/Bot — Automated No-Reply Notification (Auto-Excluded)',
    department: 'operations',
    from: 'no-reply@mailer-bot.example.net',
    fromName: 'Automated Mail System',
    subject: 'Automatic reply: System maintenance scheduled',
    text: `This is an automated system notification. Please do not reply to this email.`
  }
};

export async function GET() {
  return NextResponse.json({
    success: true,
    presets: SIMULATION_PRESETS
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let from = body.from;
    let fromName = body.fromName;
    let to = body.to;
    let subject = body.subject;
    let text = body.text;
    let department = body.department as Department;
    let inReplyTo = body.inReplyTo;
    let references = body.references;

    // Use preset if selected
    if (body.presetId && SIMULATION_PRESETS[body.presetId]) {
      const p = SIMULATION_PRESETS[body.presetId];
      from = p.from;
      fromName = p.fromName;
      subject = p.subject;
      text = p.text;
      department = p.department;
      to = DEPARTMENTS[p.department].email;
    }

    if (!to && department && DEPARTMENTS[department]) {
      to = DEPARTMENTS[department].email;
    }

    const payload = {
      from: from || 'test.sender@example.com',
      fromName: fromName || 'Test Sender',
      to: to || 'operations@tasknera.com',
      subject: subject || 'Test Inquiry',
      text: text || 'This is a test inbound email message.',
      inReplyTo,
      references
    };

    const result = await processIncomingEmail(payload);

    return NextResponse.json({
      success: true,
      simulationResult: result
    });
  } catch (err: any) {
    console.error('Error in /api/inbox/simulate:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
