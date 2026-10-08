import { EmailGenerationPayload, GeneratedEmailResult } from '../types/outreach.js';

type OutreachIntent =
  | 'recruitment_hiring'
  | 'sales_bdm'
  | 'software_product'
  | 'partnership'
  | 'meeting_request'
  | 'discussion_followup'
  | 'general_business';

export function classifyIntent(reason: string): OutreachIntent {
  const r = reason.toLowerCase();
  if (r.includes('recruit') || r.includes('hire') || r.includes('developer') || r.includes('staffing') || r.includes('talent') || r.includes('capacity')) {
    return 'recruitment_hiring';
  }
  if (r.includes('product') || r.includes('software') || r.includes('platform') || r.includes('tool') || r.includes('saas') || r.includes('solution')) {
    return 'software_product';
  }
  if (r.includes('partner') || r.includes('collaboration') || r.includes('alliance') || r.includes('synergy')) {
    return 'partnership';
  }
  if (r.includes('meet') || r.includes('demo') || r.includes('call') || r.includes('sync') || r.includes('schedule')) {
    return 'meeting_request';
  }
  if (r.includes('previous') || r.includes('follow up') || r.includes('earlier') || r.includes('spoke')) {
    return 'discussion_followup';
  }
  if (r.includes('sales') || r.includes('bdm') || r.includes('outreach') || r.includes('business dev')) {
    return 'sales_bdm';
  }
  return 'general_business';
}

const BANNED_CLICHES = [
  "hope you're doing well",
  "hope this email finds you well",
  "i am writing to introduce",
  "we would love to connect",
  "please let me know if you're interested",
  "touching base",
  "just checking in",
  "bump this to the top of your inbox",
  "act now",
  "limited time",
  "guaranteed results",
  "100% free"
];

const INITIAL_SUBJECT_TEMPLATES: Record<OutreachIntent, string[]> = {
  recruitment_hiring: [
    'Supporting {company} with Software & Tech Hiring',
    'Exploring a Tech Hiring Partnership with {company}',
    'Scaling Engineering Capacity at {company}',
    'Engineering & Technical Talent for {company}',
    'A Focused Hiring Collaboration with {company}',
    '{company} + Tech Recruiting Support',
    'Helping {company} Scale Its Engineering Bench',
    'Solving Tech Talent Bottlenecks at {company}'
  ],
  sales_bdm: [
    'Quick idea for {company}’s Growth Trajectory',
    'Streamlining Key Workflows at {company}',
    'Accelerating Business Milestones for {company}',
    'Potential Synergies for {company}',
    'A Fresh Perspective on Operational Scale at {company}',
    'Practical Value for {company}’s Current Priorities',
    'Strategic Growth Initiative with {company}'
  ],
  software_product: [
    'Modernizing Workflow Efficiency at {company}',
    'A Targeted Solution for {company}',
    'Boosting Product & Process Velocity at {company}',
    'A New Approach to Automation for {company}',
    'Enhancing System Capabilities at {company}',
    'Architecture & Productivity Upgrade for {company}'
  ],
  partnership: [
    'Exploring a Strategic Collaboration with {company}',
    'Potential Partnership Avenues with {company}',
    'Collaborative Opportunities for {company}',
    'Mutually Beneficial Synergy with {company}',
    'Partnership Discussion: {company} & Our Team'
  ],
  meeting_request: [
    'Brief Conversation Regarding {company}’s Growth',
    '10-Minute Introductory Sync for {company}',
    'Connecting Briefly Regarding {company}’s Roadmap',
    'Quick Exchange on {company}’s Upcoming Goals'
  ],
  discussion_followup: [
    'Continuing Our Dialogue Regarding {company}',
    'Next Steps on Our Recent Discussion with {company}',
    'Revisiting Our Prior Conversation Regarding {company}',
    'Following Up on Notes for {company}'
  ],
  general_business: [
    'Collaborating with {company} on High-Impact Initiatives',
    'Strategic Initiative for {company}',
    'Quick Note Regarding {company}’s Roadmap',
    'Exploring Practical Alignment with {company}'
  ]
};

const OPENINGS: Record<OutreachIntent, string[]> = {
  recruitment_hiring: [
    'I’ve been tracking {company}’s recent milestones and know how critical dependable engineering capacity is right now.',
    'Scaling technical bandwidth without months of recruitment lag remains one of the sharpest bottlenecks for growing tech organizations.',
    'Noticeable momentum around {company} prompted me to reach out directly regarding your technical team expansion.',
    'Given {company}’s active focus on product development, finding pre-vetted engineers who ship high-standard code quickly is often top of mind.',
    'I wanted to reach out regarding how your engineering team at {company} handles specialized hiring surges during high-priority sprints.'
  ],
  sales_bdm: [
    'I’m reaching out because several teams in your sector face common operational friction when scaling new initiatives.',
    'Rather than sending a generic cold note, I wanted to share a specific observation regarding how {company} approaches market execution.',
    'Seeing {company}’s current direction, there is a clear opportunity to optimize throughput while keeping team overhead lean.',
    'We recently worked with teams navigating similar growth plateaus to what {company} might be observing right now.'
  ],
  software_product: [
    'Most teams we talk to in your industry spend needless hours dealing with fragmented tooling and slow execution cycles.',
    'We built our platform specifically to eliminate repetitive manual overhead for fast-moving companies like {company}.',
    'Looking at {company}’s technological footprint, integrating streamlined workflow automation could save hours of redundant engineering effort.',
    'I wanted to introduce a focused tool designed to enhance efficiency and visibility across your key operations.'
  ],
  partnership: [
    'There is a natural overlap between what our respective organizations focus on in the current market landscape.',
    'I have been admiring {company}’s market position and see a straightforward path where our teams could mutually amplify value.',
    'Collaborative partnerships work best when both teams solve complementary halves of the same customer problem.',
    'Reaching out to explore whether combining capabilities between {company} and our team makes sense for upcoming initiatives.'
  ],
  meeting_request: [
    'I’d appreciate the chance to compare notes briefly on how {company} is tackling high-leverage challenges this quarter.',
    'Keeping this brief: I wanted to check whether you have 10 minutes open this week to discuss practical alignment with {company}.',
    'Given {company}’s current objectives, a concise introductory exchange could highlight several immediate wins.'
  ],
  discussion_followup: [
    'Following up on our earlier dialogue regarding {company}’s upcoming initiatives.',
    'Circling back to the points raised during our previous interaction to see how your schedule looks this week.',
    'Reflecting on our earlier exchange, I wanted to check in on the timing for {company}’s planned next phase.'
  ],
  general_business: [
    'I’m reaching out directly regarding {company}’s ongoing priorities in the sector.',
    'Our team focuses on delivering concrete, measurable outcomes for forward-thinking organizations like {company}.',
    'I wanted to share a concise perspective on how {company} could unlock immediate bandwidth without heavy onboarding friction.'
  ]
};

const VALUE_ANGLES: Record<OutreachIntent, string[]> = {
  recruitment_hiring: [
    'We provide pre-screened senior software developers and dedicated pods ready to contribute within 48 to 72 hours—bypassing traditional headhunter overhead and lengthy recruiter delays.',
    'Our model pairs your engineering leadership with senior talent tested on real-world system architecture, ensuring zero ramp-up compromise on code quality.',
    'Whether you need to quickly cover backend microservices, modern frontend architecture, or end-to-end cloud infrastructure, our network delivers reliable candidates directly aligned with your tech stack.',
    'By pre-evaluating candidates across algorithm design, system scalability, and proactive communication, we cut interview attrition rates down to single digits.'
  ],
  sales_bdm: [
    'We specialize in helping businesses systematically capture qualified opportunities and scale revenue pipelines with predictable execution.',
    'Our systematic framework frees up internal leadership from routine operational drag, delivering measurable ROI within the initial 30 days.',
    'We focus strictly on measurable commercial outcomes, aligning directly with your team’s core KPIs.'
  ],
  software_product: [
    'Our software integrates into your existing infrastructure in minutes, automating manual processes and providing live actionable intelligence.',
    'Teams using our platform report a 40% reduction in turnaround times along with comprehensive audit transparency.',
    'Designed with a clean, zero-friction interface, your team gets full capability without cumbersome multi-week onboarding cycles.'
  ],
  partnership: [
    'A joint alliance allows {company} to expand client offerings with minimal overhead, while creating an ongoing mutual referral stream.',
    'We bring specialized technical execution while complementing {company}’s established client relationships and domain authority.',
    'By integrating our offerings, we can jointly deliver an end-to-end proposition that neither of us would want to build independently.'
  ],
  meeting_request: [
    'We have assembled a few tailored insights specifically for {company} that I can walk through in a concise 10-minute briefing.',
    'A short, informal call would let us gauge whether there is genuine mutual alignment without any sales pressure.'
  ],
  discussion_followup: [
    'I have compiled the additional notes we touched on, structured around {company}’s immediate timeline and resource needs.',
    'We are ready to share the tailored roadmap that directly addresses the requirements we walked through.'
  ],
  general_business: [
    'Our core strength is delivering speed and reliability with transparent communication and proven deliverables.',
    'We tailor our engagement specifically to your operating constraints so you retain full control over deliverables.'
  ]
};

const CTAS: string[] = [
  'Would you be open to a brief 10-minute introductory call this Thursday or Friday?',
  'Are you open to a quick 10-minute conversation to see if this aligns with your current priorities?',
  'Does your calendar have 10 minutes open early next week for a zero-obligation discussion?',
  'If this is relevant to your current roadmap, what does your availability look like for a brief sync?',
  'Would you be against me sending over a 1-page summary of how we helped similar teams?',
  'If you are open to exploring this, I can work around your schedule for a quick 10-minute touchpoint.'
];

const FOLLOW_UP_1_SUBJECTS = [
  'Quick follow-up regarding {company}',
  'Additional thought for {company}',
  'Re: Supporting {company}’s goals',
  'Brief check-in regarding {company}',
  'Resources & capacity for {company}'
];

const FOLLOW_UP_1_HOOKS = [
  'I wanted to float my previous note back to your radar in case it slipped through during a busy week.',
  'Sharing a quick follow-up to my earlier message regarding our support for {company}.',
  'I know how quickly inboxes fill up, so I wanted to touch back briefly on the note I sent a couple of days ago.',
  'Reaching back out with a quick additional perspective on how we help organizations like {company}.'
];

const FOLLOW_UP_1_VALUES: Record<OutreachIntent, string[]> = {
  recruitment_hiring: [
    'In addition to on-demand developers, we also offer trial periods where you evaluate engineer work before committing to long-term engagements.',
    'We recently placed 3 senior full-stack engineers in under a week for a peer company facing urgent quarterly deadlines.',
    'We maintain a live roster of developers who are available immediately for full-time or fractional support.'
  ],
  sales_bdm: [
    'Beyond the initial framework mentioned, we have flexible engagement tiers that fit current operational bandwidth.',
    'Our team typically identifies 2-3 immediate low-hanging efficiency gains within the first exploratory session.'
  ],
  software_product: [
    'We recently released an interactive sandbox demo that showcases the workflow improvements in under 3 minutes.',
    'Our platform requires zero migration downtime, meaning your team sees immediate results from day one.'
  ],
  partnership: [
    'We’ve seen similar strategic alliances generate immediate shared value within the first quarter.',
    'We have prepared a preliminary one-pager highlighting where our mutual services complement each other.'
  ],
  meeting_request: [
    'I’m happy to accommodate whenever your schedule allows—even a 5-minute call is plenty to establish relevance.',
    'If phone or video isn’t convenient, I’d be glad to answer any questions directly over email.'
  ],
  discussion_followup: [
    'Wanted to check if you had a chance to review the points from our previous exchange.',
    'We are keeping a slot open this week if you’d like to resume where we left off.'
  ],
  general_business: [
    'We want to make sure you have the exact resources needed when making decisions for {company}.',
    'Happy to send through a short summary if that’s easier to review on the go.'
  ]
};

const FOLLOW_UP_2_SUBJECTS = [
  'Idea for {company}',
  'Specific use case for {company}',
  'Quick question regarding {company}',
  'Alternative approach for {company}',
  '{company} - a quick practical question'
];

const FOLLOW_UP_2_ANGLES: Record<OutreachIntent, string[]> = {
  recruitment_hiring: [
    'Often when we speak with technical leaders at organizations like {company}, their primary concern is candidate retention and technical autonomy. We specifically structure our contracts with replacement guarantees and complete IP assignment.',
    'A quick question: is finding specialized technical talent currently a bottleneck for your roadmap, or are your internal hiring channels keeping pace?',
    'One of our partners cut their technical recruitment costs by 45% while decreasing time-to-hire from 7 weeks to 6 days.'
  ],
  sales_bdm: [
    'Curious if optimizing your current business development cycle is an active focus this quarter, or if you already have dedicated initiatives in flight?',
    'A practical metric: clients using our framework typically achieve an 80% decrease in manual administrative turnaround within 3 weeks.'
  ],
  software_product: [
    'A common question we hear from technical teams: how complex is the deployment? Setup is literally single-click and runs alongside your current stack without conflicts.',
    'Are workflow delays or tooling fragmentation an active friction point for your team right now, or is that well managed?'
  ],
  partnership: [
    'Would you be open to an informal 5-minute exploratory chat just to benchmark whether a co-marketing or mutual referral model makes commercial sense for {company}?',
    'We often structure non-exclusive referral models where your team earns direct revenue without handling the operational delivery.'
  ],
  meeting_request: [
    'I understand schedules can be packed. If a sync isn’t ideal, I’m happy to send across 2 quick bullet points highlighting what we can unlock for {company}.',
    'Would 10 minutes next Tuesday or Wednesday work better for your calendar?'
  ],
  discussion_followup: [
    'Wanted to confirm if your priorities have shifted since our last touchpoint, or if revisiting this next month would be more timely.',
    'A quick question to see if your team has had a chance to reflect on the timeline we discussed.'
  ],
  general_business: [
    'Is this initiative something on your radar for this quarter, or should I follow up later in the year?',
    'Just wanted to check if there is an alternative contact at {company} who manages this area if you aren’t the best person to speak with.'
  ]
};

const FOLLOW_UP_3_SUBJECTS = [
  'Closing the loop for {company}',
  'Final check-in regarding {company}',
  'Respecting your time: {company}',
  'Permission to close file for {company}',
  'One final note regarding {company}'
];

const FOLLOW_UP_3_BODIES = [
  'I don’t want to crowd your inbox if the timing isn’t right for {company}. I’ll assume your team is currently focused elsewhere and step back for now. Should hiring or capacity needs arise in the future, feel free to reach back out anytime.',
  'I wanted to make one final attempt to connect regarding our support for {company}. If this isn’t a priority right now, no problem at all—I will close out my notes. Wishing you and {company} continued success.',
  'I recognize you’re likely balancing high-priority initiatives, so I’ll respectfully pause outreach here. If circumstances shift and you’d like to explore how we can support {company}, my door is always open.',
  'Closing the loop on my end. If {company} has room to revisit this down the line, please keep our details handy. Thank you for your time and all the best.'
];

function pickRandom<T>(items: T[], exclude?: T[]): T {
  const filtered = exclude ? items.filter(i => !exclude.includes(i)) : items;
  const pool = filtered.length > 0 ? filtered : items;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateEmailQuality(
  subject: string,
  body: string,
  companyName: string,
  reason: string,
  previousEmails: string[] = []
): { valid: boolean; notes: string[] } {
  const notes: string[] = [];
  const lowerBody = body.toLowerCase();
  const lowerSubject = subject.toLowerCase();

  if (!lowerBody.includes(companyName.toLowerCase()) && !lowerSubject.includes(companyName.toLowerCase())) {
    notes.push('Warning: Company name not explicitly mentioned.');
  }

  for (const phrase of BANNED_CLICHES) {
    if (lowerBody.includes(phrase)) {
      notes.push(`Spam phrase detected: "${phrase}".`);
    }
  }

  if (body.includes('!!!') || subject.includes('!!!')) {
    notes.push('Excessive exclamation marks detected.');
  }
  if (subject === subject.toUpperCase() && subject.length > 10) {
    notes.push('All-caps subject detected.');
  }

  for (const prev of previousEmails) {
    if (prev && prev.trim().length > 0) {
      if (body.trim() === prev.trim() || subject.trim().toLowerCase() === prev.trim().toLowerCase()) {
        notes.push('Identical or overly repetitive copy detected from previous email.');
      }
    }
  }

  const count = wordCount(body);
  if (count < 25) {
    notes.push('Email is too short.');
  }

  const valid = notes.length === 0;
  return { valid, notes };
}

function generateLocalEmail(payload: EmailGenerationPayload): GeneratedEmailResult {
  const {
    companyName,
    reason,
    recipientName,
    previousSubject,
    previousEmails = [],
    followUpNumber = 0,
    tone = 'Professional',
  } = payload;

  const intent = classifyIntent(reason);
  const cleanCompany = companyName.trim() || 'your team';
  const salutation = recipientName && recipientName.trim() ? `Hi ${recipientName.trim()},` : `Hi ${cleanCompany} Team,`;

  let subject = '';
  let bodyContent = '';
  let emailType = '';

  if (followUpNumber === 0) {
    emailType = `initial_${intent}`;
    const subjectTemplates = INITIAL_SUBJECT_TEMPLATES[intent] || INITIAL_SUBJECT_TEMPLATES.general_business;
    const pastSubjects = previousSubject ? [previousSubject] : [];
    const template = pickRandom(subjectTemplates, pastSubjects);
    subject = template.replace('{company}', cleanCompany);

    const opening = pickRandom(OPENINGS[intent] || OPENINGS.general_business).replace(/{company}/g, cleanCompany);
    const valueAngle = pickRandom(VALUE_ANGLES[intent] || VALUE_ANGLES.general_business).replace(/{company}/g, cleanCompany);
    const cta = pickRandom(CTAS);

    const customContext = reason.trim().length > 15
      ? `Specifically regarding our focus: ${reason.replace(/introduce|introduce our|help them/gi, 'delivering dedicated support to').trim()}.`
      : `Our team specializes in aligning directly with ${cleanCompany}’s strategic benchmarks.`;

    const paragraphs = [
      salutation,
      opening,
      `${customContext} ${valueAngle}`,
      cta
    ];

    bodyContent = paragraphs.join('\n\n');
  } else if (followUpNumber === 1) {
    emailType = 'follow_up_1_value_add';
    const subjTemplate = pickRandom(FOLLOW_UP_1_SUBJECTS);
    subject = subjTemplate.replace('{company}', cleanCompany);

    const hook = pickRandom(FOLLOW_UP_1_HOOKS).replace(/{company}/g, cleanCompany);
    const extraValue = pickRandom(FOLLOW_UP_1_VALUES[intent] || FOLLOW_UP_1_VALUES.general_business).replace(/{company}/g, cleanCompany);
    const cta = pickRandom([
      `Does your schedule allow a quick 10-minute touchpoint this week?`,
      `Are you open to a brief conversation this Friday?`,
      `Would you be interested in a 5-minute chat to discuss?`
    ]);

    bodyContent = [
      salutation,
      hook,
      extraValue,
      cta
    ].join('\n\n');
  } else if (followUpNumber === 2) {
    emailType = 'follow_up_2_specific_use_case';
    const subjTemplate = pickRandom(FOLLOW_UP_2_SUBJECTS);
    subject = subjTemplate.replace('{company}', cleanCompany);

    const angle = pickRandom(FOLLOW_UP_2_ANGLES[intent] || FOLLOW_UP_2_ANGLES.general_business).replace(/{company}/g, cleanCompany);
    const cta = pickRandom([
      `If you have 5 minutes to compare notes, let me know what day works best.`,
      `Happy to share a 2-minute overview if you'd like a quick look.`,
      `Would love to hear your thoughts if this is on your radar.`
    ]);

    bodyContent = [
      salutation,
      angle,
      cta
    ].join('\n\n');
  } else {
    emailType = 'follow_up_3_closing_loop';
    const subjTemplate = pickRandom(FOLLOW_UP_3_SUBJECTS);
    subject = subjTemplate.replace('{company}', cleanCompany);

    const finalBody = pickRandom(FOLLOW_UP_3_BODIES).replace(/{company}/g, cleanCompany);

    bodyContent = [
      salutation,
      finalBody
    ].join('\n\n');
  }

  const quality = validateEmailQuality(subject, bodyContent, cleanCompany, reason, previousEmails);

  return {
    subject,
    body: bodyContent,
    emailType,
    tone,
    wordCount: wordCount(bodyContent),
    qualityPassed: quality.valid,
    qualityNotes: quality.notes
  };
}

async function generateWithOpenAI(
  payload: EmailGenerationPayload,
  apiKey: string
): Promise<GeneratedEmailResult> {
  const {
    companyName,
    reason,
    recipientName,
    previousSubject,
    previousEmails = [],
    followUpNumber = 0,
    tone = 'Professional'
  } = payload;

  const intent = classifyIntent(reason);
  const stage =
    followUpNumber === 0
      ? 'Initial Outreach Email (Day 0, 100-180 words, compelling value proposition, concise hook, low friction CTA)'
      : followUpNumber === 1
      ? 'Follow-Up 1 (Day 2, 50-120 words, gentle reference to previous outreach, introduce an additional value angle or proof point, polite CTA)'
      : followUpNumber === 2
      ? 'Follow-Up 2 (Day 4, 50-100 words, different specific use case/benefit or thoughtful direct question, zero desperation)'
      : 'Follow-Up 3 (Day 6, 40-80 words, polite final check-in closing the loop gracefully, zero pressure, professional exit)';

  const systemPrompt = `You are an elite B2B sales development and executive outreach expert.
You write highly personalized, natural, human-sounding emails.
CRITICAL RULES:
- NEVER use spam clichés: "Hope you're doing well", "I am writing to introduce", "We would love to connect", "Please let me know if you're interested", "Touching base", "Just checking in".
- Keep formatting clean: normal paragraphs, no markdown bolding (**), no bullet lists unless essential.
- Do NOT include placeholder tokens like [Your Name] or signature lines, because the signature is appended automatically by the system.
- Vary the opening, sentence structure, value pitch, and CTA every single time.
- Output MUST be valid JSON only with keys: "subject", "body", "emailType", "tone". Do not include markdown \`\`\`json wrappers.`;

  const userPrompt = `
Generate an email for:
Company: ${companyName}
Recipient Name: ${recipientName || 'Not specified'}
Reason for Outreach: "${reason}"
Outreach Category: ${intent}
Stage: ${stage}
Desired Tone: ${tone}
Previous Subject (Do NOT repeat or imitate): "${previousSubject || 'None'}"
Previous Emails Sent (Do NOT repeat copy): ${JSON.stringify(previousEmails)}

Provide response in JSON:
{
  "subject": "Unique professional subject line",
  "body": "Email body text",
  "emailType": "${intent}_${followUpNumber}",
  "tone": "${tone}"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.85,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  const parsed = JSON.parse(content);

  const quality = validateEmailQuality(
    parsed.subject,
    parsed.body,
    companyName,
    reason,
    previousEmails
  );

  return {
    subject: parsed.subject,
    body: parsed.body,
    emailType: parsed.emailType || `outreach_${intent}`,
    tone: parsed.tone || tone,
    wordCount: wordCount(parsed.body),
    qualityPassed: quality.valid,
    qualityNotes: quality.notes
  };
}

export async function generateOutreachEmail(
  payload: EmailGenerationPayload,
  openAiApiKey?: string
): Promise<GeneratedEmailResult> {
  const key = openAiApiKey || process.env.OPENAI_API_KEY;

  if (key && key.trim().startsWith('sk-')) {
    try {
      const openAiResult = await generateWithOpenAI(payload, key.trim());
      if (!openAiResult.qualityPassed) {
        return generateLocalEmail(payload);
      }
      return openAiResult;
    } catch (err) {
      console.warn('OpenAI generation failed or errored, falling back to dynamic local engine:', err);
      return generateLocalEmail(payload);
    }
  }

  let result = generateLocalEmail(payload);
  let attempts = 0;
  while (!result.qualityPassed && attempts < 3) {
    result = generateLocalEmail(payload);
    attempts++;
  }
  return result;
}
