import { EmailGenerationPayload, GeneratedEmailResult } from '@/types/outreach';

// Classification angles for the AI Outreach & Platform Solutions
export type OutreachIntent =
  | 'pain_screening_bottleneck'  // Angle 1: Recruiters drowning in CVs, manual screening drag
  | 'time_saving'                // Angle 2: Saving 8-10 hours/week per recruiter, faster submittals
  | 'high_volume'                // Angle 3: Large applicant batches, candidate pool auto-ranking
  | 'recruiter_productivity'     // Angle 4: Higher billing capacity, consistent candidate scores
  | 'soft_cta_curiosity'         // Angle 5: Low-friction 90-sec example, conversational check
  | 'general_ats_intelligence'   // General recruitment intelligence & matching
  | 'vcs'                        // Topic 1: Virtual Customer Support (VCS) (Dedicated human-led support across voice, chat, email, WhatsApp, SLA-aligned delivery)
  | 'recruitment_services'       // Topic 2: Recruitment & Talent Acquisition (Permanent, contract, executive, IT & non-IT, high-volume hiring)
  | 'software_solutions'         // Topic 3: HR Technology & Digital Solutions / Software Solutions (HRMS, workforce dashboards, automation, integrated ecosystem)
  | 'ats_crm'                    // Topic 4: HireIQ — ATS & Recruitment Intelligence / ATS + CRM (AI JD analysis, resume parsing, scoring, ranking, CRM integration)
  | 'hrms_crm';                  // Topic 5: HRMS & Employee Lifecycle Management / HRMS + CRM (Employee records, onboarding, leave, payroll, performance, CRM integration)

export function classifyIntent(reason: string, mailTopic?: string): OutreachIntent {
  const t = (mailTopic || '').toLowerCase();
  if (t.includes('vcs') || t.includes('customer support') || t.includes('virtual customer')) return 'vcs';
  if (t.includes('recruitment') || t.includes('talent acquisition') || t.includes('hiring')) return 'recruitment_services';
  if (t.includes('digital solutions') || t.includes('hr tech') || t.includes('software')) return 'software_solutions';
  if (t.includes('hireiq') || t.includes('ats')) return 'ats_crm';
  if (t.includes('hrms') || t.includes('employee lifecycle')) return 'hrms_crm';

  const r = reason.toLowerCase();
  if (
    r.includes('virtual customer support') ||
    r.includes('customer support') ||
    r.includes('vcs') ||
    r.includes('live chat') ||
    r.includes('voice support') ||
    r.includes('whatsapp') ||
    r.includes('enquiries') ||
    r.includes('sla') ||
    r.includes('flexible workforce') ||
    r.includes('staffing support') ||
    r.includes('workforce planning')
  ) return 'vcs';

  if (
    r.includes('talent acquisition') ||
    r.includes('recruitment') ||
    r.includes('sourcing and screening') ||
    r.includes('shortlisting') ||
    r.includes('executive hiring') ||
    r.includes('contract hiring') ||
    r.includes('high-volume hiring')
  ) return 'recruitment_services';

  if (
    r.includes('digital solutions') ||
    r.includes('hr technology') ||
    r.includes('hr tech') ||
    r.includes('software solution') ||
    r.includes('workforce dashboard') ||
    r.includes('workflow automation') ||
    r.includes('employee self-service') ||
    r.includes('simplify workflows')
  ) return 'software_solutions';

  if (
    r.includes('hireiq') ||
    r.includes('ats + crm') ||
    r.includes('ats and crm') ||
    r.includes('recruitment intelligence') ||
    r.includes('resume parsing') ||
    r.includes('candidate evaluation') ||
    (r.includes('ats') && r.includes('crm'))
  ) return 'ats_crm';

  if (
    r.includes('hrms + crm') ||
    r.includes('hrms and crm') ||
    r.includes('hrms') ||
    r.includes('employee lifecycle') ||
    r.includes('onboarding and offboarding') ||
    r.includes('employee records')
  ) return 'hrms_crm';

  // Angle 1: Pain point / bottleneck / manual screening overload
  if (
    r.includes('bottleneck') ||
    r.includes('manual') ||
    r.includes('drown') ||
    r.includes('overload') ||
    r.includes('sift') ||
    r.includes('backlog') ||
    r.includes('unqualified') ||
    r.includes('pain')
  ) {
    return 'pain_screening_bottleneck';
  }

  // Angle 2: Time saving / cut screening hours
  if (
    r.includes('time') ||
    r.includes('hour') ||
    r.includes('speed') ||
    r.includes('faster') ||
    r.includes('fast') ||
    r.includes('shave') ||
    r.includes('quick') ||
    r.includes('save')
  ) {
    return 'time_saving';
  }

  // Angle 3: High volume / large pools / batch parsing
  if (
    r.includes('volume') ||
    r.includes('hundreds') ||
    r.includes('batch') ||
    r.includes('large') ||
    r.includes('pool') ||
    r.includes('database') ||
    r.includes('mass') ||
    r.includes('scale')
  ) {
    return 'high_volume';
  }

  // Angle 4: Productivity / placement velocity / consistency / billing
  if (
    r.includes('productivity') ||
    r.includes('placement') ||
    r.includes('velocity') ||
    r.includes('consist') ||
    r.includes('score') ||
    r.includes('ranking') ||
    r.includes('submittal') ||
    r.includes('billing') ||
    r.includes('capacity')
  ) {
    return 'recruiter_productivity';
  }

  // Angle 5: Soft CTA / curiosity / walkthrough
  if (
    r.includes('curiosity') ||
    r.includes('soft') ||
    r.includes('walkthrough') ||
    r.includes('example') ||
    r.includes('video') ||
    r.includes('conversation') ||
    r.includes('chat')
  ) {
    return 'soft_cta_curiosity';
  }

  return 'time_saving';
}

// Banned clichés to guarantee deliverability, natural voice, and avoid spam filters
export const BANNED_CLICHES = [
  "hope you're doing well",
  "hope this email finds you well",
  "i am writing to introduce",
  "we would love to connect",
  "please let me know if you're interested",
  "touching base",
  "just checking in",
  "bump this to the top of your inbox",
  "bumping this to the top",
  "act now",
  "limited time",
  "guaranteed results",
  "100% free",
  "10x your",
  "revolutionary",
  "exclusive opportunity",
  "urgent",
  "game-changer",
  "synergy",
  "disruptive",
  "cutting-edge",
  "streamline your operations today"
];

// Helper to extract clean first name and optional designation
export function parseRecipientDetails(recipientName?: string): { firstName: string; fullName: string; designation?: string } {
  if (!recipientName || !recipientName.trim()) {
    return { firstName: '', fullName: '' };
  }

  const raw = recipientName.trim();
  // Check if title is attached with comma, hyphen, or pipe e.g. "John Doe, Head of Talent"
  const titleSeparators = [',', ' - ', ' | '];
  let namePart = raw;
  let designationPart = '';

  for (const sep of titleSeparators) {
    if (raw.includes(sep)) {
      const parts = raw.split(sep);
      namePart = parts[0].trim();
      designationPart = parts.slice(1).join(sep).trim();
      break;
    }
  }

  // Clean first name
  const words = namePart.split(/\s+/).filter(Boolean);
  // Filter out courtesy titles if present
  let first = words[0] || '';
  if (/^(mr|mrs|ms|dr|prof)\.?$/i.test(first) && words.length > 1) {
    first = words[1];
  }

  return {
    firstName: first,
    fullName: namePart,
    designation: designationPart || undefined
  };
}

// Generates 3 professional alternative subject lines (Direct, Value-Focused, Conversational)
export function generateSubjectLineVariations(
  company: string,
  intent: OutreachIntent,
  topic?: string
): { primary: string; direct: string; valueFocused: string; conversational: string } {
  const cleanComp = company.trim() || 'your team';

  // Natural, contextual subject lines based on intent
  const subjectTemplates = {
    vcs: {
      primary: [`Customer support for ${cleanComp}`, `Supporting ${cleanComp}'s customers`, `${cleanComp} customer service`],
      direct: [`Customer support team for ${cleanComp}`, `VCS for ${cleanComp}`, `Customer service support`],
      valueFocused: [`Reduce support workload at ${cleanComp}`, `Scale customer service for ${cleanComp}`, `Customer support that grows with you`],
      conversational: [`Quick question about customer support`, `Helping with customer inquiries`, `Customer service at ${cleanComp}`]
    },
    recruitment_services: {
      primary: [`Hiring support for ${cleanComp}`, `Recruitment help for ${cleanComp}`, `${cleanComp} talent acquisition`],
      direct: [`End-to-end recruitment for ${cleanComp}`, `Hiring team for ${cleanComp}`, `Recruitment services`],
      valueFocused: [`Streamline hiring at ${cleanComp}`, `Faster recruitment for ${cleanComp}`, `Scale your hiring process`],
      conversational: [`Question about your hiring process`, `Helping with recruitment`, `Hiring at ${cleanComp}`]
    },
    software_solutions: {
      primary: [`HR technology for ${cleanComp}`, `Streamlining operations at ${cleanComp}`, `${cleanComp} workflow automation`],
      direct: [`HR tech solutions for ${cleanComp}`, `Digital solutions for ${cleanComp}`, `HR software integration`],
      valueFocused: [`Connect your HR systems`, `Automate workflows at ${cleanComp}`, `Integrated HR platform`],
      conversational: [`Quick question about HR systems`, `Connecting your operations`, `HR technology at ${cleanComp}`]
    },
    ats_crm: {
      primary: [`Resume screening for ${cleanComp}`, `HireIQ for ${cleanComp}`, `Candidate evaluation help`],
      direct: [`ATS + CRM for ${cleanComp}`, `Automated resume screening`, `Recruitment intelligence`],
      valueFocused: [`Save time screening candidates`, `Faster candidate evaluation`, `Rank resumes automatically`],
      conversational: [`Question about resume screening`, `Candidate evaluation process`, `Screening resumes at ${cleanComp}`]
    },
    hrms_crm: {
      primary: [`Employee management for ${cleanComp}`, `HRMS for ${cleanComp}`, `HR system integration`],
      direct: [`HRMS + CRM integration`, `Employee lifecycle management`, `HR management system`],
      valueFocused: [`Streamline employee operations`, `Connect HR and client data`, `Integrated employee management`],
      conversational: [`Question about HR management`, `Employee systems at ${cleanComp}`, `HR operations help`]
    },
    pain_screening_bottleneck: {
      primary: [`Resume screening for ${cleanComp}`, `Candidate evaluation help`, `${cleanComp} hiring process`],
      direct: [`Automated resume screening`, `Candidate screening solution`, `Resume evaluation platform`],
      valueFocused: [`Save hours on resume screening`, `Faster candidate shortlisting`, `Streamline your hiring`],
      conversational: [`Question about screening resumes`, `Hiring workflow at ${cleanComp}`, `Candidate evaluation process`]
    },
    high_volume: {
      primary: [`High-volume hiring for ${cleanComp}`, `Batch candidate processing`, `Scale your recruitment`],
      direct: [`High-volume recruitment solution`, `Bulk candidate screening`, `Large-scale hiring support`],
      valueFocused: [`Process more candidates faster`, `Scale hiring efficiently`, `Handle candidate volume`],
      conversational: [`Question about hiring volume`, `Managing candidate flow`, `Recruitment capacity at ${cleanComp}`]
    },
    recruiter_productivity: {
      primary: [`Recruiting efficiency for ${cleanComp}`, `Faster hiring process`, `Recruiter productivity`],
      direct: [`Recruitment efficiency platform`, `Hiring acceleration tools`, `Recruiter workflow optimization`],
      valueFocused: [`Boost recruiting productivity`, `Faster candidate placement`, `Streamline recruiter workflow`],
      conversational: [`Question about recruiting efficiency`, `Hiring speed at ${cleanComp}`, `Recruiter workflow help`]
    },
    time_saving: {
      primary: [`Save hiring time at ${cleanComp}`, `Faster recruitment process`, `Time-efficient hiring`],
      direct: [`Recruitment time optimization`, `Hiring efficiency solution`, `Accelerated candidate screening`],
      valueFocused: [`Cut screening time by 70%`, `Hours saved on hiring`, `Faster time-to-hire`],
      conversational: [`Question about hiring time`, `Recruitment efficiency`, `Speeding up your process`]
    },
    soft_cta_curiosity: {
      primary: [`Quick question for ${cleanComp}`, `Something for ${cleanComp}`, `Thought this might help`],
      direct: [`Business solution for ${cleanComp}`, `Operational support`, `Growth solution`],
      valueFocused: [`Streamline operations at ${cleanComp}`, `Efficiency improvement`, `Operational optimization`],
      conversational: [`Quick question`, `Helping with operations`, `Business question for ${cleanComp}`]
    }
  };

  // Default fallback
  const defaultTemplates = {
    primary: [`Support for ${cleanComp}`, `Quick question for ${cleanComp}`, `Helping ${cleanComp} scale`],
    direct: [`Business solutions for ${cleanComp}`, `Operational support`, `Growth solutions`],
    valueFocused: [`Streamline operations at ${cleanComp}`, `Scale efficiently`, `Operational efficiency`],
    conversational: [`Quick question`, `Helping with operations`, `Business question`]
  };

  const templates = subjectTemplates[intent] || defaultTemplates;
  
  // Add randomization to avoid repetitive patterns
  const getRandomTemplate = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  return {
    primary: getRandomTemplate(templates.primary),
    direct: getRandomTemplate(templates.direct),
    valueFocused: getRandomTemplate(templates.valueFocused),
    conversational: getRandomTemplate(templates.conversational)
  };
}
      return {
        primary: `managing applicant volume at ${cleanComp}`,
        direct: `High-volume candidate matching for ${cleanComp}`,
        valueFocused: `Auto-ranking candidate pools for ${cleanComp}`,
        conversational: `Quick question on ${cleanComp}'s applicant volume`
      };
    case 'recruiter_productivity':
      return {
        primary: `recruiter desk capacity at ${cleanComp}`,
        direct: `Placement velocity & candidate evaluation for ${cleanComp}`,
        valueFocused: `Accelerating candidate submittal speed at ${cleanComp}`,
        conversational: `Shortlist turnaround for ${cleanComp}`
      };
    case 'soft_cta_curiosity':
      return {
        primary: `quick question about ${cleanComp}'s recruitment workflow`,
        direct: `Candidate matching & screening at ${cleanComp}`,
        valueFocused: `Saving recruiter time on CV review for ${cleanComp}`,
        conversational: `Quick question for ${cleanComp}`
      };
    case 'time_saving':
    default:
      return {
        primary: `saving recruiter hours on cv screening at ${cleanComp}`,
        direct: `Candidate screening turnaround for ${cleanComp}`,
        valueFocused: `Saving 8-10 hours weekly on resume review at ${cleanComp}`,
        conversational: `Quick note regarding ${cleanComp}'s candidate review process`
      };
  }
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Strict quality scoring according to professional B2B cold outreach standards
export interface QualityAssessment {
  valid: boolean;
  notes: string[];
  wordCount: number;
  checks: {
    noPlaceholders: boolean;
    noSpamCliches: boolean;
    hasProperLength: boolean;
    hasSingleCta: boolean;
    cleanFormatting: boolean;
  };
}

export function validateEmailQuality(
  subject: string,
  body: string,
  companyName: string,
  reason: string,
  previousEmails: string[] = [],
  followUpNumber: number = 0
): QualityAssessment {
  const notes: string[] = [];
  const lowerBody = body.toLowerCase();
  const lowerSubject = subject.toLowerCase();

  // 1. Placeholder check - ensure no unresolved template tokens remain
  const placeholderRegex = /{{.*?}}|\[.*?\]|\bundefined\b|\bNaN\b/i;
  const hasPlaceholders = placeholderRegex.test(body) || placeholderRegex.test(subject);
  if (hasPlaceholders) {
    notes.push('Unresolved placeholders detected (e.g. {{...}} or [...]).');
  }

  // 2. Banned clichés and spam words check
  let foundSpam = false;
  for (const phrase of BANNED_CLICHES) {
    if (lowerBody.includes(phrase)) {
      notes.push(`Spam or generic phrase detected: "${phrase}".`);
      foundSpam = true;
    }
  }

  // 3. Exclamation & all-caps checks
  const exclamations = (body.match(/!/g) || []).length;
  if (exclamations > 1) {
    notes.push('Excessive exclamation marks detected.');
  }
  if (subject === subject.toUpperCase() && subject.length > 10) {
    notes.push('All-caps subject line detected.');
  }

  // 4. Word count check: Professional B2B standards
  // Initial: 80 to 150 words. Follow-up: 40 to 95 words.
  const count = wordCount(body);
  const isInitial = followUpNumber === 0;
  let hasProperLength = true;

  if (isInitial) {
    if (count < 75) {
      notes.push(`Initial email is ${count} words; aim for 80-150 words to communicate value clearly.`);
      hasProperLength = false;
    } else if (count > 165) {
      notes.push(`Initial email is ${count} words; aim for 80-150 words to avoid cognitive overload.`);
      hasProperLength = false;
    }
  } else {
    if (count < 30) {
      notes.push(`Follow-up email is only ${count} words; clarify the perspective.`);
      hasProperLength = false;
    } else if (count > 115) {
      notes.push(`Follow-up email is ${count} words; keep follow-ups concise (45-90 words).`);
      hasProperLength = false;
    }
  }

  // 5. Structure and CTA check
  const paragraphs = body.trim().split(/\n\s*\n/).filter(Boolean);
  const cleanFormatting = paragraphs.length >= 2;
  if (!cleanFormatting) {
    notes.push('Email lacks clear paragraph separation (needs at least 2 distinct paragraphs).');
  }

  const hasSingleCta = body.includes('?');
  if (!hasSingleCta) {
    notes.push('Email does not contain a clear conversational question or call to action.');
  }

  // 6. Repetition check against previous touches
  for (const prev of previousEmails) {
    if (prev && prev.trim().length > 0) {
      if (body.trim() === prev.trim() || subject.trim().toLowerCase() === prev.trim().toLowerCase()) {
        notes.push('Email copy is identical to a previously generated message.');
      }
    }
  }

  const valid = !hasPlaceholders && !foundSpam && count >= 35 && exclamations <= 2;

  return {
    valid,
    notes,
    wordCount: count,
    checks: {
      noPlaceholders: !hasPlaceholders,
      noSpamCliches: !foundSpam,
      hasProperLength,
      hasSingleCta,
      cleanFormatting
    }
  };
}

// Sanitizes and formats clean text (strips markdown bold, quotes, and json wrappers)
function sanitizeEmailBody(raw: string): string {
  let cleaned = raw
    .replace(/```[a-z]*\n?([\s\S]*?)```/gi, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^["']|["']$/g, '')
    .trim();

  // Normalize paragraph breaks
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return cleaned;
}

// High-performing local synthesis engine based on TaskNera HR Solutions & AI ATS Framework
// Produces 85-140 words for initial emails and 50-85 words for follow-ups
function generateLocalEmail(payload: EmailGenerationPayload): GeneratedEmailResult {
  const {
    companyName,
    reason,
    mailTopic,
    recipientName,
    previousSubject,
    previousEmails = [],
    followUpNumber = 0,
    tone = 'Professional',
  } = payload;

  const intent = classifyIntent(reason, mailTopic);
  const cleanCompany = companyName.trim() || 'your company';
  const context = analyzeRecipientContext(recipientName, cleanCompany, payload.companyWebsite, reason);

  // Natural, varied greetings
  const greetings = context.firstName ? [
    `Hi ${context.firstName},`,
    `Hello ${context.firstName},`,
    `Hi there ${context.firstName},`
  ] : [
    `Hi there,`,
    `Hello,`,
    `Hi,`
  ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const subjects = generateSubjectLineVariations(cleanCompany, intent, mailTopic);
  const subject = subjects.primary;
  const alternativeSubjects = [subjects.direct, subjects.valueFocused, subjects.conversational];

  let bodyContent = '';
  let emailType = '';

  if (followUpNumber === 0) {
    emailType = `initial_${intent}`;

    // Generate natural, contextual opening
    const opening = generateContextualOpening(context, cleanCompany, intent);
    
    // Natural value proposition based on context
    const valueProp = generateNaturalValueProp(intent, context, cleanCompany);
    
    // Conversational CTA
    const cta = generateNaturalCTA(intent, cleanCompany, context);

    bodyContent = [greeting, opening, valueProp, cta].join('\n\n');
  } else if (followUpNumber === 1) {
    emailType = `followup1_${intent}`;

    const followUpOpenings = [
      `I sent a note last week about how we help companies like ${cleanCompany} with ${intent.replace('_', ' ')}.`,
      `Wanted to circle back on my message about supporting ${cleanCompany}'s ${intent.replace('_', ' ')} needs.`,
      `Following up on my message about how we could help streamline operations at ${cleanCompany}.`
    ];

    const followUpValues = {
      vcs: `Many of our clients find that having dedicated support teams lets them focus on core business growth instead of managing customer service operations.`,
      recruitment_services: `Most companies we work with see immediate relief once they have a dedicated team handling their recruitment pipeline.`,
      software_solutions: `The companies we work with typically see better workflow efficiency within the first month of implementation.`,
      ats_crm: `Teams using HireIQ typically cut their screening time by 60-70% while improving candidate quality.`,
      hrms_crm: `Our clients usually see streamlined operations and better data visibility within weeks of implementation.`
    };

    const followUpCTAs = [
      `Still worth exploring for ${cleanCompany}?`,
      `Would a brief conversation make sense for your team?`,
      `Think this could be relevant for your current priorities?`
    ];

    bodyContent = [
      greeting,
      followUpOpenings[Math.floor(Math.random() * followUpOpenings.length)],
      followUpValues[intent] || followUpValues.software_solutions,
      followUpCTAs[Math.floor(Math.random() * followUpCTAs.length)]
    ].join('\n\n');
  } else if (followUpNumber === 2) {
    emailType = `followup2_${intent}`;

    const insights = {
      vcs: `Most businesses handle about 30% more customer inquiries during growth phases, but internal teams often struggle to scale support quality consistently.`,
      recruitment_services: `I've noticed that companies growing quickly often spend 40-50% of their time on recruitment logistics rather than strategic hiring decisions.`,
      software_solutions: `Many companies we speak with mention that their biggest operational challenge is getting different systems to work together effectively.`,
      ats_crm: `Most recruitment teams tell us they spend more time reading resumes than actually talking to qualified candidates.`,
      hrms_crm: `One thing I've learned from our clients is that disconnected HR and CRM systems often create duplicate data entry and missed opportunities.`
    };

    bodyContent = [
      greeting,
      insights[intent] || insights.software_solutions,
      `That's exactly what we help companies like ${cleanCompany} solve.`,
      `Would it be helpful to see how this works in practice?`
    ].join('\n\n');
  } else if (followUpNumber === 3) {
    emailType = `followup3_${intent}`;

    const qualifyingQuestions = [
      `Is streamlining ${intent.replace('_', ' ')} something ${cleanCompany} is actively working on this quarter?`,
      `Are you currently looking at solutions to improve your ${intent.replace('_', ' ')} processes?`,
      `How is ${cleanCompany} handling ${intent.replace('_', ' ')} challenges right now?`
    ];

    bodyContent = [
      greeting,
      `I've reached out a couple times about how we help with ${intent.replace('_', ' ')} at companies like ${cleanCompany}.`,
      qualifyingQuestions[Math.floor(Math.random() * qualifyingQuestions.length)]
    ].join('\n\n');
  } else {
    emailType = `final_${intent}`;

    bodyContent = [
      greeting,
      `I know you're busy, so I'll keep this brief.`,
      `If ${intent.replace('_', ' ')} support becomes a priority for ${cleanCompany} in the future, feel free to reach out.`,
      `Thanks for your time.`
    ].join('\n\n');
  }

  const quality = validateEmailQuality(
    subject,
    bodyContent,
    cleanCompany,
    reason,
    previousEmails,
    followUpNumber
  );

  return {
    subject,
    body: bodyContent,
    emailType,
    tone,
    wordCount: quality.wordCount,
    qualityPassed: quality.valid,
    qualityNotes: quality.notes,
    alternativeSubjects
  };
}
    // STAGE 1 (Day 2-3): Respectful Reminder & Problem Re-frame (50-75 words)
    emailType = 'follow_up_1_problem_reframe';

    const hook = `Following up on my note from earlier this week regarding ${cleanCompany}'s workflow.`;
    let contextNote = '';

    if (intent === 'ats_crm' || intent === 'pain_screening_bottleneck' || intent === 'time_saving') {
      contextNote = `One pattern we frequently see in recruitment teams is that over 60% of screening time is spent reviewing applicants who do not meet mandatory criteria. If your recruiters could cut that initial evaluation pass down to seconds, would that meaningfully help your quarterly hiring goals?`;
    } else if (intent === 'vcs') {
      contextNote = `Maintaining responsive customer support during peak enquiry surges or outside standard hours can quickly strain internal bandwidth. Having dedicated, SLA-aligned support across voice, live chat, WhatsApp, and email ensures customer satisfaction without service disruptions.`;
    } else if (intent === 'recruitment_services') {
      contextNote = `Balancing fast hiring turnaround with rigorous candidate qualification remains a major challenge. Having dedicated sourcing and shortlisting support across permanent or contract roles keeps talent pipelines active without overburdening your internal team.`;
    } else if (intent === 'hrms_crm' || intent === 'software_solutions') {
      contextNote = `Managing HR records in one tool and business relationships in another often leads to duplicated administrative effort and blind spots between teams.`;
    } else {
      contextNote = `Finding the right balance between operational speed and thorough execution remains a major priority for growing teams.`;
    }

    const cta = `Would you be open to a brief 5-minute conversation later this week to see if there's a practical fit?`;
    bodyContent = [salutation, hook, contextNote, cta].join('\n\n');
  } else if (followUpNumber === 2) {
    // STAGE 2 (Day 4-6): Micro Workflow Insight & Proof (55-80 words)
    emailType = 'follow_up_2_micro_proof';

    const leadIn = `I wanted to share a brief practical example that may be relevant to ${cleanCompany}:`;
    let insight = '';

    if (intent === 'ats_crm' || intent === 'pain_screening_bottleneck' || intent === 'time_saving') {
      insight = `A recruitment team recently deployed HireIQ on several active requisitions. By automatically parsing resumes against role criteria and ranking top candidates upfront, they cut their candidate shortlisting review time from two days to under three hours.`;
    } else if (intent === 'vcs') {
      insight = `A business partnering with our Virtual Customer Support team transitioned their live chat, WhatsApp, and email support to our dedicated pods, achieving 98% first-response SLA adherence while reducing customer escalation rates by 35%.`;
    } else if (intent === 'recruitment_services') {
      insight = `An organization partnering with our talent acquisition team filled four critical specialized positions within two weeks by leveraging our pre-screened candidate pipeline, reducing their time-to-hire by nearly 50%.`;
    } else if (intent === 'hrms_crm' || intent === 'software_solutions') {
      insight = `A growing company centralized their employee lifecycle records and operational workflows onto our platform, eliminating manual reconciliation and saving their operations team over six hours each week.`;
    } else {
      insight = `Teams using our solutions typically reduce their manual administrative coordination by over 50% within the first month of implementation.`;
    }

    const cta = `Would it be useful if I sent over a short 1-page summary of how they structured it?`;
    bodyContent = [salutation, leadIn, insight, cta].join('\n\n');
  } else if (followUpNumber === 3) {
    // STAGE 3 (Day 7-9): Simple Binary Qualifying Question (40-60 words)
    emailType = 'follow_up_3_qualifying_question';

    const question = `Quick question regarding ${cleanCompany}: is optimizing your current ${
      intent === 'ats_crm' ? 'resume screening and candidate shortlisting' :
      intent === 'vcs' ? 'customer support operations and SLA delivery' :
      intent === 'recruitment_services' ? 'recruitment pipeline and hiring turnaround' :
      intent === 'hrms_crm' ? 'employee lifecycle and CRM workflows' : 'HR technology and business workflows'
    } an active priority for your team this quarter, or is your current setup already meeting all your needs? Either way, I appreciate your time and perspective.`;

    bodyContent = [salutation, question].join('\n\n');
  } else {
    // STAGE 4 (Day 10+): Permission-Based Breakup / Closing Loop (35-50 words)
    emailType = 'follow_up_4_breakup';

    const breakup = `I don't want to clutter your inbox if the timing isn't right for ${cleanCompany}. I'll assume your team is currently focused elsewhere and step back for now.\n\nIf this ever becomes a priority down the road, please feel free to reach back out anytime. Wishing you and ${cleanCompany} continued success.`;

    bodyContent = [salutation, breakup].join('\n\n');
  }

  const cleanBody = sanitizeEmailBody(bodyContent);
  const quality = validateEmailQuality(subject, cleanBody, cleanCompany, reason, previousEmails, followUpNumber);

  return {
    subject,
    body: cleanBody,
    emailType,
    tone,
    wordCount: quality.wordCount,
    qualityPassed: quality.valid,
    qualityNotes: quality.notes,
    alternativeSubjects
  };
}

// Enhanced recipient analysis for better personalization
function analyzeRecipientContext(recipientName?: string, companyName?: string, companyWebsite?: string, reason?: string) {
  const { firstName, designation } = parseRecipientDetails(recipientName);
  
  // Industry detection from company website or context
  const detectIndustry = (website?: string, company?: string, reason?: string) => {
    const text = `${website || ''} ${company || ''} ${reason || ''}`.toLowerCase();
    
    if (text.includes('healthcare') || text.includes('hospital') || text.includes('medical')) return 'healthcare';
    if (text.includes('fintech') || text.includes('bank') || text.includes('finance') || text.includes('insurance')) return 'finance';
    if (text.includes('tech') || text.includes('software') || text.includes('saas') || text.includes('app')) return 'technology';
    if (text.includes('retail') || text.includes('ecommerce') || text.includes('shop')) return 'retail';
    if (text.includes('manufact') || text.includes('industrial')) return 'manufacturing';
    if (text.includes('consult') || text.includes('service')) return 'services';
    if (text.includes('startup') || text.includes('growth')) return 'startup';
    
    return 'general';
  };

  // Role-based pain point detection
  const detectRolePains = (designation?: string) => {
    if (!designation) return [];
    
    const role = designation.toLowerCase();
    const pains = [];
    
    if (role.includes('hr') || role.includes('people') || role.includes('talent')) {
      pains.push('manual_hiring_processes', 'employee_lifecycle_management', 'talent_shortage');
    }
    if (role.includes('ceo') || role.includes('founder') || role.includes('cto')) {
      pains.push('operational_efficiency', 'scaling_challenges', 'resource_optimization');
    }
    if (role.includes('operations') || role.includes('ops')) {
      pains.push('workflow_automation', 'process_standardization', 'cost_optimization');
    }
    if (role.includes('customer') || role.includes('support') || role.includes('service')) {
      pains.push('customer_satisfaction', 'support_scalability', 'response_times');
    }
    
    return pains;
  };

  return {
    firstName,
    designation,
    industry: detectIndustry(companyWebsite, companyName, reason),
    rolePains: detectRolePains(designation),
    hasPersonalization: !!(firstName || designation)
  };
}

// Natural conversation starters based on context
function generateContextualOpening(context: any, companyName: string, intent: OutreachIntent) {
  const { firstName, designation, industry, hasPersonalization } = context;
  
  const openings = {
    vcs: [
      hasPersonalization ? 
        `Hi ${firstName}, I came across your work at ${companyName} and thought you might find this relevant.` :
        `Hi, I wanted to reach out about something that might be relevant for ${companyName}.`,
      hasPersonalization ? 
        `Hi ${firstName}, I noticed ${companyName}'s growth and wanted to share something that could be helpful.` :
        `Hi there, I've been following ${companyName} and wanted to share something that caught my attention.`
    ],
    recruitment_services: [
      designation ? 
        `Hi ${firstName}, saw your role as ${designation} at ${companyName} and thought this might resonate.` :
        `Hi, I wanted to reach out regarding something that might be relevant for your hiring needs.`,
      hasPersonalization ? 
        `Hi ${firstName}, I've been thinking about the hiring challenges facing companies like ${companyName}.` :
        `Hi there, I wanted to discuss something that might help with your talent acquisition efforts.`
    ],
    software_solutions: [
      `Hi ${firstName || 'there'}, I wanted to share something that might streamline your operations at ${companyName}.`,
      hasPersonalization ? 
        `Hi ${firstName}, I noticed how ${companyName} is growing and thought you might find this interesting.` :
        `Hi, I came across ${companyName} and wanted to share something that could be valuable.`
    ]
  };

  const categoryOpenings = openings[intent] || openings.software_solutions;
  return categoryOpenings[Math.floor(Math.random() * categoryOpenings.length)];
}

// Natural value propositions without buzzwords
function generateNaturalValueProp(intent: OutreachIntent, context: any, companyName: string) {
  const { industry, rolePains } = context;
  
  const valueProp = {
    vcs: `We handle customer support across phone, chat, email, and WhatsApp - essentially becoming an extension of your team. Our people follow your processes and maintain your service standards while you focus on growing the business.`,
    
    recruitment_services: industry === 'technology' ? 
      `We handle the entire recruitment process for tech companies - from sourcing developers to screening and coordinating interviews. It's like having a dedicated hiring team without the overhead.` :
      `We take care of end-to-end recruitment - sourcing, screening, and coordinating interviews across all types of roles. Think of it as your external hiring team that knows your standards.`,
    
    software_solutions: `We've built HR technology that actually connects the dots - recruitment, employee management, and client relationships all work together instead of being separate systems.`,
    
    ats_crm: `HireIQ reads through resumes and matches them against your job requirements automatically. Instead of spending hours reviewing CVs, you get ranked lists of qualified candidates in minutes.`,
    
    hrms_crm: `Our HRMS handles everything from employee records to payroll, and connects with your customer management. It's designed for businesses that want their people operations and client work to flow together seamlessly.`
  };

  return valueProp[intent] || valueProp.software_solutions;
}

// Natural, conversational CTAs
function generateNaturalCTA(intent: OutreachIntent, companyName: string, context: any) {
  const ctas = [
    `Worth a quick chat to see if this makes sense for ${companyName}?`,
    `Would you be open to a brief conversation about how this could work for your team?`,
    `Interested in seeing how this might fit with what you're building at ${companyName}?`,
    `Would it be helpful if I showed you how this works in practice?`,
    `Think this could be relevant for your current priorities?`
  ];
  
  return ctas[Math.floor(Math.random() * ctas.length)];
}

// Master OpenAI generator implementing natural, human-sounding email generation
async function generateWithOpenAI(
  payload: EmailGenerationPayload,
  apiKey: string
): Promise<GeneratedEmailResult> {
  const {
    companyName,
    reason,
    mailTopic,
    recipientName,
    companyWebsite,
    previousSubject,
    previousEmails = [],
    followUpNumber = 0,
    tone = 'Professional'
  } = payload;

  const intent = classifyIntent(reason, mailTopic);
  const cleanCompany = companyName.trim() || 'your company';
  const context = analyzeRecipientContext(recipientName, cleanCompany, companyWebsite, reason);

  const stageDescription =
    followUpNumber === 0
      ? 'Initial Cold Outreach Email (STRICTLY 85 to 135 words. Write naturally and conversationally like a real professional reaching out peer-to-peer. Focus on being helpful rather than sales-y. Use varied sentence structures and natural transitions).'
      : followUpNumber === 1
      ? 'Follow-Up 1 (STRICTLY 50 to 75 words. Natural follow-up that adds value or perspective without being pushy. Reference the original message contextually without saying "following up" or "checking in").'
      : followUpNumber === 2
      ? 'Follow-Up 2 (STRICTLY 55 to 80 words. Share a genuine insight or practical perspective. Offer something concrete and valuable).'
      : followUpNumber === 3
      ? 'Follow-Up 3 (STRICTLY 40 to 60 words. Simple qualifying question to understand their current situation. Show genuine interest in their priorities).'
      : 'Follow-Up 4 (STRICTLY 35 to 50 words. Graceful close that respects their time and leaves the door open for future conversations).';

  const systemPrompt = `You are a seasoned business professional writing personalized outreach emails for TaskNera HR Solutions (https://tasknera.com).

Your emails should sound like they were written by a real person, not an AI. Write naturally, conversationally, and authentically.

CORE SERVICES TO ADAPT FROM:
1. Virtual Customer Support (VCS): Human-led support teams across phone, chat, email, WhatsApp. We become an extension of their customer service team.
2. Recruitment Services: End-to-end hiring support - sourcing, screening, interview coordination for all types of roles.
3. HR Technology: Integrated platforms connecting recruitment, employee management, and client relationships.
4. HireIQ (ATS + Intelligence): AI-powered resume screening and candidate matching with ranking and scoring.
5. HRMS Solutions: Complete employee lifecycle management with integrated CRM capabilities.

NATURAL WRITING PRINCIPLES:
- Write like you're having a professional conversation, not delivering a pitch
- Use varied sentence lengths and natural transitions
- Be specific about how you can help without being pushy
- Sound genuinely interested in their business, not just making a sale
- Use simple, clear language that gets straight to the point
- Personalize meaningfully when information is available, write naturally when it's not
- Avoid corporate jargon, buzzwords, and formulaic phrases

STRICT GUIDELINES:
- Length: Initial 85-135 words, follow-ups 35-80 words
- Never use: "Hope this finds you well", "touching base", "circling back", "just checking in", "revolutionize", "game-changing", "industry-leading", artificial urgency
- Never invent facts about their company, achievements, or previous interactions
- No placeholders, signature blocks, or markdown formatting
- Natural paragraph breaks with double newlines
- One clear, conversational call-to-action

TONE ADAPTATIONS:
- Professional: Respectful and business-appropriate while remaining conversational
- Consultative: Advisory and helpful, focusing on their challenges and solutions
- Direct: Clear and to-the-point while maintaining warmth
- Friendly: Approachable and personable while staying professional

OUTPUT FORMAT - Return valid JSON only:
{
  "subject": "Natural, relevant subject line that would make them want to open it",
  "body": "Conversational email body with natural paragraph breaks",
  "directSubject": "Clear, direct alternative subject line",
  "valueFocusedSubject": "Value-focused alternative subject line",
  "conversationalSubject": "Conversational alternative subject line",
  "emailType": "${intent}_${followUpNumber}",
  "tone": "${tone}",
  "personalizationUsed": "Brief note on what personalization was applied or 'minimal' if limited info"
}`;

  const userPrompt = `CONTEXT FOR PERSONALIZED EMAIL:

Company: ${cleanCompany}
Recipient: ${recipientName || 'Team member (name not available)'}
${context.designation ? `Role: ${context.designation}` : ''}
${companyWebsite ? `Website: ${companyWebsite}` : ''}
${context.industry !== 'general' ? `Industry Context: ${context.industry}` : ''}
Service Focus: ${mailTopic || 'General HR Solutions'}
Specific Reason/Pain Point: "${reason}"
Category: ${intent}
Email Stage: ${stageDescription}
Tone Preference: ${tone}
${previousSubject ? `Previous Subject (avoid): "${previousSubject}"` : ''}
${context.rolePains.length > 0 ? `Likely Role Challenges: ${context.rolePains.join(', ')}` : ''}

IMPORTANT CONTEXT:
- Personalization Available: ${context.hasPersonalization ? 'Yes - use thoughtfully' : 'Limited - write naturally without forced personalization'}
- Write like a real business professional reaching out peer-to-peer
- Focus on being genuinely helpful rather than selling
- Use natural, varied sentence structures
- Be conversational but maintain professionalism
- If you don't have enough information to personalize meaningfully, write a clear, relevant email without it

${previousEmails.length > 0 ? `Previous emails in thread for context: ${JSON.stringify(previousEmails.slice(-2))}` : ''}`;

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
      temperature: 0.7,
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

  const cleanSubject = (parsed.subject || '').replace(/^["']|["']$/g, '').trim();
  const cleanBody = sanitizeEmailBody(parsed.body || '');

  // Variations
  const defaultVars = generateSubjectLineVariations(cleanCompany, intent, mailTopic);
  const altSubjects = [
    parsed.directSubject || defaultVars.direct,
    parsed.valueFocusedSubject || defaultVars.valueFocused,
    parsed.conversationalSubject || defaultVars.conversational
  ];

  const quality = validateEmailQuality(
    cleanSubject,
    cleanBody,
    cleanCompany,
    reason,
    previousEmails,
    followUpNumber
  );

  return {
    subject: cleanSubject,
    body: cleanBody,
    emailType: parsed.emailType || `outreach_${intent}`,
    tone: parsed.tone || tone,
    wordCount: quality.wordCount,
    qualityPassed: quality.valid,
    qualityNotes: quality.notes,
    alternativeSubjects: altSubjects
  };
}

// Master email generation service with automatic quality validation and fallback
export async function generateOutreachEmail(
  payload: EmailGenerationPayload,
  openAiApiKey?: string
): Promise<GeneratedEmailResult> {
  const key = openAiApiKey || process.env.OPENAI_API_KEY;

  if (key && key.trim().startsWith('sk-')) {
    try {
      const openAiResult = await generateWithOpenAI(payload, key.trim());
      if (openAiResult.qualityPassed) {
        return openAiResult;
      }
      console.warn('OpenAI result had quality warnings, attempting local fallback:', openAiResult.qualityNotes);
    } catch (err) {
      console.warn('OpenAI generation failed or errored, falling back to local engine:', err);
    }
  }

  // Use upgraded local synthesis engine with quality check
  let result = generateLocalEmail(payload);
  let attempts = 0;
  while (!result.qualityPassed && attempts < 3) {
    result = generateLocalEmail(payload);
    attempts++;
  }
  return result;
}
