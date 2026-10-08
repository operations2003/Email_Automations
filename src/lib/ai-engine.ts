import { EmailGenerationPayload, GeneratedEmailResult } from '@/types/outreach';

// Classification types for TaskNera services and outreach
export type OutreachIntent =
  | 'tasknera_hireiq'
  | 'tasknera_staffing'
  | 'tasknera_software'
  | 'tasknera_ats'
  | 'recruitment_hiring'
  | 'sales_bdm'
  | 'software_product'
  | 'partnership'
  | 'meeting_request'
  | 'discussion_followup'
  | 'general_business';

export function classifyIntent(reason: string): OutreachIntent {
  const r = reason.toLowerCase();

  // TaskNera HireIQ - AI JD matching & candidate screening
  if (
    r.includes('hireiq') ||
    r.includes('hire iq') ||
    r.includes('hirei') ||
    r.includes('jd match') ||
    r.includes('job description') ||
    r.includes('resume screen') ||
    r.includes('screening') ||
    r.includes('candidate match') ||
    r.includes('shortlist')
  ) {
    return 'tasknera_hireiq';
  }

  // TaskNera Tech Staffing & Dedicated Engineering Pods
  if (
    r.includes('staffing') ||
    r.includes('pod') ||
    r.includes('developer') ||
    r.includes('engineer') ||
    r.includes('tech talent') ||
    r.includes('hire dev') ||
    r.includes('hiring capacity') ||
    r.includes('coder') ||
    r.includes('bench') ||
    r.includes('tech hiring')
  ) {
    return 'tasknera_staffing';
  }

  // TaskNera Custom Software & AI Development
  if (
    r.includes('custom software') ||
    r.includes('app dev') ||
    r.includes('web dev') ||
    r.includes('software dev') ||
    r.includes('ai solution') ||
    r.includes('ai agent') ||
    r.includes('cloud') ||
    r.includes('product engineering') ||
    r.includes('mvp') ||
    r.includes('build software')
  ) {
    return 'tasknera_software';
  }

  // TaskNera ATS & Recruitment Automation
  if (
    r.includes('ats') ||
    r.includes('recruitment auto') ||
    r.includes('hiring pipeline') ||
    r.includes('recruiting workflow') ||
    r.includes('rpo')
  ) {
    return 'tasknera_ats';
  }

  // General recruitment/hiring fallback
  if (r.includes('recruit') || r.includes('hire') || r.includes('talent')) {
    return 'tasknera_staffing';
  }

  if (r.includes('product') || r.includes('software') || r.includes('platform') || r.includes('tool') || r.includes('saas') || r.includes('solution')) {
    return 'tasknera_software';
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

// Banned clichés to guarantee freshness and prevent spam reputation
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

// Anti-repetition dynamic pools for initial emails
const INITIAL_SUBJECT_TEMPLATES: Record<OutreachIntent, string[]> = {
  tasknera_hireiq: [
    'Speeding up Candidate Screening at {company} with HireIQ',
    'HireIQ: AI-Powered JD & Resume Matching for {company}',
    'Automating Technical Resume Screening at {company}',
    'HireIQ by TaskNera for {company}’s Tech Roles',
    'Cutting Engineering Screening Cycles at {company}',
    'HireIQ + {company}: Higher-Signal Tech Candidate Matching'
  ],
  tasknera_staffing: [
    'TaskNera: Pre-Vetted Senior Engineers for {company} in 48-72h',
    'Supporting {company} with On-Demand Engineering Capacity',
    'Dedicated Software Engineering Pods for {company}',
    'Scaling Tech Bandwidth at {company} (TaskNera)',
    'TaskNera Senior Developers for {company}’s Roadmap',
    'Solving Tech Talent Bottlenecks at {company}'
  ],
  tasknera_software: [
    'Custom Software & AI Engineering for {company} (TaskNera)',
    'Accelerating {company}’s Product Roadmap with TaskNera',
    'Dedicated Engineering & AI Solutions for {company}',
    'Building Scalable Web & Cloud Systems for {company}',
    'Modernizing Workflow Efficiency at {company}'
  ],
  tasknera_ats: [
    'Streamlining {company}’s Recruitment Pipeline with TaskNera',
    'Recruiting Automation & ATS Optimization for {company}',
    'Accelerating Candidate Pipeline Velocity at {company}',
    'Modernizing Recruitment Workflows at {company}'
  ],
  recruitment_hiring: [
    'Supporting {company} with Software & Tech Hiring',
    'Exploring a Tech Hiring Partnership with {company}',
    'Scaling Engineering Capacity at {company}',
    'Engineering & Technical Talent for {company}',
    'A Focused Hiring Collaboration with {company}',
    '{company} + Tech Recruiting Support'
  ],
  sales_bdm: [
    'Quick idea for {company}’s Growth Trajectory',
    'Streamlining Key Workflows at {company}',
    'Accelerating Business Milestones for {company}',
    'Potential Synergies for {company}',
    'Practical Value for {company}’s Current Priorities'
  ],
  software_product: [
    'Modernizing Workflow Efficiency at {company}',
    'A Targeted Solution for {company}',
    'Boosting Product & Process Velocity at {company}',
    'A New Approach to Automation for {company}'
  ],
  partnership: [
    'Exploring a Strategic Collaboration with {company}',
    'Potential Partnership Avenues with {company}',
    'Collaborative Opportunities for {company}',
    'Partnership Discussion: {company} & TaskNera Team'
  ],
  meeting_request: [
    'Brief Conversation Regarding {company}’s Growth',
    '10-Minute Introductory Sync for {company}',
    'Connecting Briefly Regarding {company}’s Roadmap'
  ],
  discussion_followup: [
    'Continuing Our Dialogue Regarding {company}',
    'Next Steps on Our Recent Discussion with {company}',
    'Revisiting Our Prior Conversation Regarding {company}'
  ],
  general_business: [
    'Collaborating with {company} on High-Impact Initiatives',
    'Strategic Initiative for {company}',
    'Quick Note from TaskNera Regarding {company}’s Roadmap'
  ]
};

// Varied openings for initial outreach
const OPENINGS: Record<OutreachIntent, string[]> = {
  tasknera_hireiq: [
    'I’m reaching out from the TaskNera team regarding HireIQ—our AI platform built to help technical hiring teams match job descriptions to top candidates and automate resume screening.',
    'With {company} scaling its technical team, manual resume review often becomes one of the slowest stages before technical interview rounds.',
    'I wanted to share a quick note from the TaskNera team on how we help engineering leaders eliminate recruiter screening bottlenecks using HireIQ.',
    'Given {company}’s active focus on high-standard engineering hires, I wanted to introduce HireIQ, our AI-powered candidate screening and JD matching platform.'
  ],
  tasknera_staffing: [
    'I’m reaching out from the TaskNera team. We help growing tech organizations scale engineering capacity with pre-vetted senior software developers ready in 48 to 72 hours.',
    'Noticeable momentum around {company} prompted me to reach out from the TaskNera team regarding your technical roadmap.',
    'Scaling technical bandwidth without months of recruitment lag remains one of the sharpest bottlenecks for growing tech organizations like {company}.',
    'I wanted to reach out from TaskNera regarding how your engineering team at {company} handles specialized hiring surges during high-priority sprints.'
  ],
  tasknera_software: [
    'I’m reaching out from the TaskNera team regarding our custom software and AI product development services.',
    'Looking at {company}’s product footprint, our engineering team at TaskNera helps companies build scalable web, mobile, and custom AI automation solutions.',
    'We partner with engineering and product leaders at companies like {company} to accelerate feature delivery without the overhead of long hiring cycles.'
  ],
  tasknera_ats: [
    'I’m reaching out from the TaskNera team regarding how modern organizations optimize and automate their technical recruitment pipelines.',
    'TaskNera provides recruitment workflow automation that unifies applicant screening, interview coordination, and candidate tracking into a seamless process.'
  ],
  recruitment_hiring: [
    'I’m reaching out from the TaskNera team. We’ve been tracking {company}’s recent milestones and know how critical dependable engineering capacity is right now.',
    'Scaling technical bandwidth without months of recruitment lag remains one of the sharpest bottlenecks for growing tech organizations like {company}.'
  ],
  sales_bdm: [
    'I’m reaching out from TaskNera because several teams in your sector face common operational friction when scaling new initiatives.',
    'Rather than sending a generic cold note, I wanted to share a specific observation regarding how {company} approaches market execution.'
  ],
  software_product: [
    'We built our solution at TaskNera specifically to eliminate repetitive manual overhead for fast-moving companies like {company}.',
    'Looking at {company}’s technological footprint, integrating streamlined workflow automation could save hours of redundant engineering effort.'
  ],
  partnership: [
    'There is a natural overlap between what TaskNera and {company} focus on in the current technology landscape.',
    'Reaching out from TaskNera to explore whether combining capabilities with {company} makes sense for upcoming initiatives.'
  ],
  meeting_request: [
    'I’d appreciate the chance to compare notes briefly on how {company} is tackling high-leverage challenges this quarter.',
    'Keeping this brief: I wanted to check whether you have 10 minutes open this week to discuss practical alignment with TaskNera.'
  ],
  discussion_followup: [
    'Following up on our earlier dialogue regarding {company}’s upcoming initiatives.',
    'Circling back from the TaskNera team to the points raised during our previous interaction to see how your schedule looks this week.'
  ],
  general_business: [
    'I’m reaching out directly from the TaskNera team regarding {company}’s ongoing technical and hiring priorities.',
    'Our team at TaskNera focuses on delivering concrete, measurable outcomes for forward-thinking organizations like {company}.'
  ]
};

// Varied value proposition angles
const VALUE_ANGLES: Record<OutreachIntent, string[]> = {
  tasknera_hireiq: [
    'HireIQ matches job descriptions directly against candidate profiles with contextual AI scoring, cutting initial screening time by 70% while ensuring only high-caliber developers reach your interview loops.',
    'Instead of brittle keyword searches, HireIQ analyzes project depth, architectural scope, and stack proficiency so your team only spends interview bandwidth on genuine matches.',
    'Engineering and recruitment teams using HireIQ review pre-scored candidate shortlists in minutes, integrating smoothly with your existing ATS and hiring workflows.',
    'By pre-evaluating candidates across core system competencies and verifiable experience upfront, HireIQ helps teams eliminate screening bias and reduce interview drop-off.'
  ],
  tasknera_staffing: [
    'We provide pre-screened senior software developers and dedicated pods ready to contribute within 48 to 72 hours—bypassing traditional headhunter overhead and lengthy recruiter delays.',
    'Our model pairs your engineering leadership with senior talent tested on real-world system architecture, ensuring zero ramp-up compromise on code quality.',
    'Whether you need backend microservices, modern frontend architecture, or end-to-end cloud infrastructure, TaskNera delivers reliable candidates directly aligned with your tech stack.',
    'All engagements include trial evaluation periods, replacement guarantees, and full intellectual property assignment from day one.'
  ],
  tasknera_software: [
    'TaskNera builds robust web, mobile, and custom AI automation solutions for high-growth tech companies with high velocity and clean architecture.',
    'We deploy dedicated engineering pods that integrate directly into your sprint cycle, taking features from concept to deployment without hiring overhead.'
  ],
  tasknera_ats: [
    'We eliminate repetitive recruitment operations, allowing your team to focus exclusively on engaging top-tier candidates and closing offers faster.'
  ],
  recruitment_hiring: [
    'We provide pre-screened senior software developers and dedicated pods ready to contribute within 48 to 72 hours—bypassing traditional headhunter overhead and recruiter delays.',
    'Our model pairs your engineering leadership with senior talent tested on real-world system architecture.'
  ],
  sales_bdm: [
    'We specialize in helping businesses systematically capture qualified opportunities and scale revenue pipelines with predictable execution.'
  ],
  software_product: [
    'Our software integrates into your existing infrastructure in minutes, automating manual processes and providing live actionable intelligence.'
  ],
  partnership: [
    'A joint alliance allows {company} to expand client offerings with minimal overhead, while creating an ongoing mutual referral stream with TaskNera.'
  ],
  meeting_request: [
    'We have assembled a few tailored insights specifically for {company} that I can walk through in a concise 10-minute briefing.'
  ],
  discussion_followup: [
    'I have compiled the additional notes we touched on, structured around {company}’s immediate timeline and resource needs.'
  ],
  general_business: [
    'Our core strength is delivering speed and reliability with transparent communication and proven deliverables.'
  ]
};

// Varied CTAs
const CTAS: string[] = [
  'Would you be open to a brief 10-minute introductory call this Thursday or Friday?',
  'Are you open to a quick 10-minute conversation to see if this aligns with your current priorities?',
  'Does your calendar have 10 minutes open early next week for a zero-obligation discussion?',
  'If this is relevant to your current roadmap, what does your availability look like for a brief sync?',
  'Would you be against me sending over a 1-page summary of how we helped similar teams?',
  'If you are open to exploring this, I can work around your schedule for a quick 10-minute touchpoint.'
];

// Varied Follow-up 1 content generators (Short reminder + additional value, 50-120 words)
const FOLLOW_UP_1_SUBJECTS = [
  'Quick follow-up regarding {company}',
  'Additional thought for {company} (TaskNera)',
  'Re: Supporting {company}’s goals',
  'Brief check-in regarding {company}',
  'Resources & capacity for {company}'
];

const FOLLOW_UP_1_HOOKS = [
  'I wanted to float my previous note back to your radar in case it slipped through during a busy week.',
  'Sharing a quick follow-up to my earlier message regarding our support for {company}.',
  'I know how quickly inboxes fill up, so I wanted to touch back briefly on the note I sent a couple of days ago.',
  'Reaching back out with a quick additional perspective on how TaskNera helps organizations like {company}.'
];

const FOLLOW_UP_1_VALUES: Record<OutreachIntent, string[]> = {
  tasknera_hireiq: [
    'We offer an interactive sandbox where your team can test HireIQ on an active job description to see how it benchmarks and scores real resumes in under 3 minutes.',
    'A quick reference: one of our partner teams recently cut their resume screening backlog by 75% within their first two weeks using HireIQ.',
    'HireIQ connects directly with standard ATS pipelines, so there is zero migration or workflow disruption for your hiring managers.'
  ],
  tasknera_staffing: [
    'In addition to on-demand developers, TaskNera also offers trial periods where you evaluate engineer work before committing to long-term engagements.',
    'We recently placed 3 senior full-stack engineers in under a week for a peer company facing urgent quarterly deadlines.',
    'We maintain a live roster of developers who are available immediately for full-time or fractional support.'
  ],
  tasknera_software: [
    'We recently helped a high-growth SaaS team build and ship an AI copilot feature in 3 weeks without expanding their internal headcount.',
    'Our engineering pods come fully equipped with dedicated tech leads and QA to ensure seamless delivery.'
  ],
  tasknera_ats: [
    'Our recruitment automation framework frees internal talent teams from routine operational drag, delivering faster pipeline movement within days.'
  ],
  recruitment_hiring: [
    'In addition to on-demand developers, we also offer trial periods where you evaluate engineer work before committing to long-term engagements.',
    'We maintain a live roster of developers who are available immediately for full-time or fractional support.'
  ],
  sales_bdm: [
    'Beyond the initial framework mentioned, we have flexible engagement tiers that fit current operational bandwidth.'
  ],
  software_product: [
    'We recently released an interactive sandbox demo that showcases the workflow improvements in under 3 minutes.'
  ],
  partnership: [
    'We have prepared a preliminary one-pager highlighting where our mutual services complement each other.'
  ],
  meeting_request: [
    'I’m happy to accommodate whenever your schedule allows—even a 5-minute call is plenty to establish relevance.'
  ],
  discussion_followup: [
    'Wanted to check if you had a chance to review the points from our previous exchange.'
  ],
  general_business: [
    'We want to make sure you have the exact resources needed when making decisions for {company}.'
  ]
};

// Varied Follow-up 2 content generators (Specific benefit / use case / simple question, 50-100 words)
const FOLLOW_UP_2_SUBJECTS = [
  'Idea for {company}',
  'Specific use case for {company}',
  'Quick question regarding {company}',
  'Alternative approach for {company}',
  '{company} - a quick practical question'
];

const FOLLOW_UP_2_ANGLES: Record<OutreachIntent, string[]> = {
  tasknera_hireiq: [
    'A common question we hear: does HireIQ rely on simple keyword filtering? No—it uses semantic AI models trained to understand technical stack depth, architecture complexity, and seniority.',
    'Are resume screening backlogs or candidate drop-offs an active friction point for {company}’s hiring team right now, or are internal pipelines keeping pace?'
  ],
  tasknera_staffing: [
    'Often when we speak with technical leaders at organizations like {company}, their primary concern is candidate retention and technical autonomy. We specifically structure our contracts with replacement guarantees and complete IP assignment.',
    'A quick question: is finding specialized technical talent currently a bottleneck for {company}’s roadmap, or are your internal hiring channels keeping pace?',
    'One of our partners cut their technical recruitment costs by 45% while decreasing time-to-hire from 7 weeks to 6 days.'
  ],
  tasknera_software: [
    'Curious if product engineering bandwidth is currently a bottleneck for {company}’s upcoming releases, or if your in-house team is fully covered?',
    'A practical metric: clients using our engineering pods typically achieve a 40% reduction in feature delivery cycle time.'
  ],
  tasknera_ats: [
    'Curious if optimizing your recruitment workflow is an active focus this quarter, or if you already have dedicated initiatives in flight?'
  ],
  recruitment_hiring: [
    'A quick question: is finding specialized technical talent currently a bottleneck for your roadmap, or are your internal hiring channels keeping pace?'
  ],
  sales_bdm: [
    'Curious if optimizing your current business development cycle is an active focus this quarter, or if you already have dedicated initiatives in flight?'
  ],
  software_product: [
    'Are workflow delays or tooling fragmentation an active friction point for your team right now, or is that well managed?'
  ],
  partnership: [
    'Would you be open to an informal 5-minute exploratory chat just to benchmark whether a mutual referral model makes commercial sense for {company}?'
  ],
  meeting_request: [
    'Would 10 minutes next Tuesday or Wednesday work better for your calendar?'
  ],
  discussion_followup: [
    'Wanted to confirm if your priorities have shifted since our last touchpoint, or if revisiting this next month would be more timely.'
  ],
  general_business: [
    'Is this initiative something on your radar for this quarter, or should I follow up later in the year?'
  ]
};

// Varied Follow-up 3 content generators (Polite final follow-up / closing loop, 40-80 words)
const FOLLOW_UP_3_SUBJECTS = [
  'Closing the loop for {company}',
  'Final check-in regarding {company}',
  'Respecting your time: {company}',
  'Permission to close file for {company}',
  'One final note from TaskNera regarding {company}'
];

const FOLLOW_UP_3_BODIES = [
  'I don’t want to crowd your inbox if the timing isn’t right for {company}. I’ll assume your team is currently focused elsewhere and step back for now. Should hiring, HireIQ candidate screening, or software capacity needs arise in the future, feel free to reach back out anytime to the TaskNera team.',
  'I wanted to make one final attempt to connect regarding how the TaskNera team can support {company}. If this isn’t a priority right now, no problem at all—I will close out my notes. Wishing you and {company} continued success.',
  'I recognize you’re likely balancing high-priority initiatives, so I’ll respectfully pause outreach here. If circumstances shift and you’d like to explore how TaskNera can support {company}, our door is always open.',
  'Closing the loop on my end. If {company} has room to revisit this down the line, please keep TaskNera’s details handy. Thank you for your time and all the best.'
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

// AI Quality Check Rule implementation
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

  // 1. Check company name presence (in subject or body)
  if (!lowerBody.includes(companyName.toLowerCase()) && !lowerSubject.includes(companyName.toLowerCase())) {
    notes.push('Warning: Company name not explicitly mentioned.');
  }

  // 2. Check for spam clichés
  for (const phrase of BANNED_CLICHES) {
    if (lowerBody.includes(phrase)) {
      notes.push(`Spam phrase detected: "${phrase}".`);
    }
  }

  // 3. Check for fake urgency or hype
  if (body.includes('!!!') || subject.includes('!!!')) {
    notes.push('Excessive exclamation marks detected.');
  }
  if (subject === subject.toUpperCase() && subject.length > 10) {
    notes.push('All-caps subject detected.');
  }

  // 4. Similarity check with previous emails
  for (const prev of previousEmails) {
    if (prev && prev.trim().length > 0) {
      if (body.trim() === prev.trim() || subject.trim().toLowerCase() === prev.trim().toLowerCase()) {
        notes.push('Identical or overly repetitive copy detected from previous email.');
      }
    }
  }

  // 5. Length verification
  const count = wordCount(body);
  if (count < 25) {
    notes.push('Email is too short.');
  }

  const valid = notes.length === 0;
  return { valid, notes };
}

// Intelligent local synthesis engine
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
    // INITIAL EMAIL (Day 0) - 100-180 words
    emailType = `initial_${intent}`;
    const subjectTemplates = INITIAL_SUBJECT_TEMPLATES[intent] || INITIAL_SUBJECT_TEMPLATES.general_business;
    const pastSubjects = previousSubject ? [previousSubject] : [];
    const template = pickRandom(subjectTemplates, pastSubjects);
    subject = template.replace('{company}', cleanCompany);

    const opening = pickRandom(OPENINGS[intent] || OPENINGS.general_business).replace(/{company}/g, cleanCompany);
    const valueAngle = pickRandom(VALUE_ANGLES[intent] || VALUE_ANGLES.general_business).replace(/{company}/g, cleanCompany);
    const cta = pickRandom(CTAS);

    // Build context sentence that flows naturally from TaskNera
    let customContext = '';
    if (intent === 'tasknera_hireiq') {
      customContext = `At TaskNera, we built HireIQ specifically to help teams like ${cleanCompany} match job descriptions to top candidates and cut candidate screening time by 70%.`;
    } else if (intent === 'tasknera_staffing') {
      customContext = `At TaskNera, we specialize in providing ${cleanCompany} with pre-vetted senior software engineers who can integrate seamlessly into your current sprint cycle.`;
    } else if (intent === 'tasknera_software') {
      customContext = `Our engineering team at TaskNera builds custom software, AI agents, and web applications tailored directly to ${cleanCompany}’s technical needs.`;
    } else if (intent === 'tasknera_ats') {
      customContext = `TaskNera helps teams like ${cleanCompany} streamline their hiring pipelines with automated screening and ATS workflows.`;
    } else if (reason.trim().length > 15) {
      customContext = `Specifically regarding our focus: ${reason.replace(/introduce|introduce our|help them/gi, 'delivering dedicated support to').trim()}.`;
    } else {
      customContext = `Our team at TaskNera specializes in aligning directly with ${cleanCompany}’s strategic benchmarks.`;
    }

    const paragraphs = [
      salutation,
      opening,
      `${customContext} ${valueAngle}`,
      cta
    ];

    bodyContent = paragraphs.join('\n\n');
  } else if (followUpNumber === 1) {
    // FOLLOW-UP 1 (Day 2) - 50-120 words
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
    // FOLLOW-UP 2 (Day 4) - 50-100 words
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
    // FOLLOW-UP 3 (Day 6) - 40-80 words (closing loop)
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

// OpenAI API generator
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

  const systemPrompt = `You are a high-level B2B business outreach specialist writing on behalf of the TaskNera team (TaskNera Solutions - https://tasknera.io).
TaskNera is a technology and talent solutions company providing:
1. HireIQ: AI-powered candidate & JD matching platform that automates resume screening and shortlists top tech talent. Cuts screening time by 70%.
2. Tech Staffing & Dedicated Developer Pods: Pre-screened senior software engineers (fullstack, backend, frontend, AI/ML) deployed in 48 to 72 hours.
3. Custom Software & AI Development: Scalable web/mobile applications, custom AI automations, and modern cloud architecture.
4. Recruitment Automation: Streamlining recruitment pipelines and ATS workflows.

CRITICAL RULES:
- Write genuinely from the TaskNera team.
- NEVER use spam clichés: "Hope you're doing well", "Hope this email finds you well", "I am writing to introduce", "We would love to connect", "Please let me know if you're interested", "Touching base", "Just checking in".
- Keep formatting clean: normal paragraphs, no markdown bolding (**), no bullet lists unless essential.
- Do NOT include placeholder tokens like [Your Name] or signature lines, because the signature is appended automatically by the system.
- Vary the opening, sentence structure, value pitch, and CTA every single time.
- Output MUST be valid JSON only with keys: "subject", "body", "emailType", "tone". Do not include markdown \`\`\`json wrappers.`;

  const userPrompt = `
Generate an email for:
Sender Organization: TaskNera Solutions (TaskNera Team)
Company: ${companyName}
Recipient Name: ${recipientName || 'Not specified'}
Reason for Outreach / Service Focus: "${reason}"
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

// Master email generation service
export async function generateOutreachEmail(
  payload: EmailGenerationPayload,
  openAiApiKey?: string
): Promise<GeneratedEmailResult> {
  const key = openAiApiKey || process.env.OPENAI_API_KEY;

  if (key && key.trim().startsWith('sk-')) {
    try {
      const openAiResult = await generateWithOpenAI(payload, key.trim());
      // Quality check verification: if quality check failed, fallback to fresh local variation
      if (!openAiResult.qualityPassed) {
        return generateLocalEmail(payload);
      }
      return openAiResult;
    } catch (err) {
      console.warn('OpenAI generation failed or errored, falling back to dynamic local engine:', err);
      return generateLocalEmail(payload);
    }
  }

  // Use dynamic local engine with quality check
  let result = generateLocalEmail(payload);
  let attempts = 0;
  while (!result.qualityPassed && attempts < 3) {
    result = generateLocalEmail(payload);
    attempts++;
  }
  return result;
}
