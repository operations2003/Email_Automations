import { EmailGenerationPayload, GeneratedEmailResult } from '@/types/outreach';
import { optimizeSubjectForDeliverability } from './email-service';

// BANNED_CLICHES constant for quality validation
export const BANNED_CLICHES = [
  'hope this email finds you well',
  'hope you\'re doing well', 
  'i hope you are well',
  'touching base',
  'just checking in',
  'bumping this to the top',
  'circling back',
  'following up on my previous email',
  'i am writing to introduce',
  'we would love to connect',
  'revolutionary',
  'game-changing', 
  'industry-leading',
  'cutting-edge',
  'best-in-class',
  'world-class',
  '10x',
  'guaranteed results',
  'urgent',
  'act now',
  'limited time',
  'i wanted to reach out to you',
  'i trust this email finds you',
  'dear sir/madam',
  'to whom it may concern'
];
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

// Helper to deterministically or randomly pick variations to prevent fingerprinting
export function selectVariant(items: string[], seedKey: string = ''): string {
  if (!items || items.length === 0) return '';
  if (!seedKey) {
    return items[Math.floor(Math.random() * items.length)];
  }
  let hash = 0;
  for (let i = 0; i < seedKey.length; i++) {
    hash = (hash << 5) - hash + seedKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % items.length;
  return items[index];
}

// Generates ultra-simple, deliverability-optimized subject lines (Direct, Simple, Conversational)
// Kept strictly to 2-4 words, natural sentence case/lowercase, zero marketing hype.
export function generateSubjectLineVariations(
  company: string,
  intent: OutreachIntent,
  topic?: string,
  seedKey?: string
): { primary: string; direct: string; valueFocused: string; conversational: string } {
  const cleanComp = company.trim() || 'your team';
  const seed = seedKey || `${cleanComp}_${intent}`;

  // Ultra-simple 2-4 word subject lines engineered for primary inbox placement
  // Using exact "Quick Question About [topic]" pattern with proper capitalization
  const subjectTemplates = {
    vcs: {
      primary: [`Quick Question About Customer Support`, `Quick Question About ${cleanComp}`, `Quick Question About Support`, `Question About Customer Support`],
      direct: [`Customer Support Question`, `Support Inquiry`, `${cleanComp} Support Question`],
      valueFocused: [`${cleanComp} Customer Support`, `Support Team Question`, `Customer Service Inquiry`],
      conversational: [`Quick Question About Support`, `Question About ${cleanComp}`, `Brief Support Question`]
    },
    recruitment_services: {
      primary: [`Quick Question About Hiring`, `Quick Question About ${cleanComp}`, `Quick Question About Recruiting`, `Question About Hiring`],
      direct: [`Hiring Question`, `Recruiting Inquiry`, `${cleanComp} Hiring Question`],
      valueFocused: [`${cleanComp} Recruiting`, `Hiring Team Question`, `Recruiting Support Inquiry`],
      conversational: [`Quick Question About Recruiting`, `Question About ${cleanComp}`, `Brief Hiring Question`]
    },
    software_solutions: {
      primary: [`Quick Question About Software`, `Quick Question About ${cleanComp}`, `Quick Question About Operations`, `Question About HR Systems`],
      direct: [`Software Question`, `Operations Inquiry`, `${cleanComp} Software Question`],
      valueFocused: [`${cleanComp} Operations`, `Software Systems Inquiry`, `HR Systems Question`],
      conversational: [`Quick Question About Systems`, `Question About ${cleanComp}`, `Brief Software Question`]
    },
    ats_crm: {
      primary: [`Quick Question About Hiring`, `Quick Question About ${cleanComp}`, `Quick Question About Recruiting`, `Question About Candidate Screening`],
      direct: [`Hiring Question`, `Recruiting Inquiry`, `${cleanComp} Hiring Question`],
      valueFocused: [`${cleanComp} Recruiting`, `Candidate Screening Question`, `Hiring Support Inquiry`],
      conversational: [`Quick Question About Screening`, `Question About ${cleanComp}`, `Brief Recruiting Question`]
    },
    hrms_crm: {
      primary: [`Quick Question About HR`, `Quick Question About ${cleanComp}`, `Quick Question About Operations`, `Question About HR Systems`],
      direct: [`HR Question`, `Operations Inquiry`, `${cleanComp} HR Question`],
      valueFocused: [`${cleanComp} HR Systems`, `HR Operations Question`, `Employee Systems Inquiry`],
      conversational: [`Quick Question About Systems`, `Question About ${cleanComp}`, `Brief HR Question`]
    },
    pain_screening_bottleneck: {
      primary: [`Quick Question About Hiring`, `Quick Question About ${cleanComp}`, `Quick Question About Recruiting`, `Question About Screening`],
      direct: [`Hiring Question`, `Recruiting Inquiry`, `${cleanComp} Hiring Question`],
      valueFocused: [`${cleanComp} Recruiting`, `Screening Question`, `Hiring Support Inquiry`],
      conversational: [`Quick Question About Screening`, `Question About ${cleanComp}`, `Brief Hiring Question`]
    },
    high_volume: {
      primary: [`Quick Question About Hiring`, `Quick Question About ${cleanComp}`, `Quick Question About Recruiting`, `Question About Volume Hiring`],
      direct: [`Hiring Question`, `Recruiting Inquiry`, `${cleanComp} Hiring Question`],
      valueFocused: [`${cleanComp} Recruiting`, `Volume Hiring Question`, `Recruiting Support Inquiry`],
      conversational: [`Quick Question About Recruiting`, `Question About ${cleanComp}`, `Brief Hiring Question`]
    },
    recruiter_productivity: {
      primary: [`Quick Question About Hiring`, `Quick Question About ${cleanComp}`, `Quick Question About Recruiting`, `Question About Productivity`],
      direct: [`Hiring Question`, `Recruiting Inquiry`, `${cleanComp} Hiring Question`],
      valueFocused: [`${cleanComp} Recruiting`, `Productivity Question`, `Recruiting Support Inquiry`],
      conversational: [`Quick Question About Recruiting`, `Question About ${cleanComp}`, `Brief Hiring Question`]
    },
    time_saving: {
      primary: [`Quick Question About Hiring`, `Quick Question About ${cleanComp}`, `Quick Question About Recruiting`, `Question About Efficiency`],
      direct: [`Hiring Question`, `Recruiting Inquiry`, `${cleanComp} Hiring Question`],
      valueFocused: [`${cleanComp} Recruiting`, `Efficiency Question`, `Recruiting Support Inquiry`],
      conversational: [`Quick Question About Recruiting`, `Question About ${cleanComp}`, `Brief Hiring Question`]
    },
    soft_cta_curiosity: {
      primary: [`Quick Question About ${cleanComp}`, `Quick Question About Business`, `Question About Collaboration`, `Quick Question About Partnership`],
      direct: [`Business Question`, `Partnership Inquiry`, `${cleanComp} Question`],
      valueFocused: [`${cleanComp} Partnership`, `Business Inquiry`, `Collaboration Question`],
      conversational: [`Quick Question About Collaboration`, `Question About ${cleanComp}`, `Brief Business Question`]
    }
  };

  // Default fallback - using exact "Quick Question About" pattern with proper capitalization
  const defaultTemplates = {
    primary: [`Quick Question About ${cleanComp}`, `Quick Question About Business`, `Question About ${cleanComp}`, `Quick Question About Partnership`],
    direct: [`Business Question`, `${cleanComp} Inquiry`, `Partnership Question`],
    valueFocused: [`${cleanComp} Partnership`, `Business Inquiry`, `Collaboration Question`],
    conversational: [`Quick Question About Business`, `Question About ${cleanComp}`, `Brief Question`]
  };

  const templates = (subjectTemplates as Record<string, any>)[intent] || defaultTemplates;

  return {
    primary: optimizeSubjectForDeliverability(selectVariant(templates.primary, seed + '_p'), 'initial', cleanComp),
    direct: optimizeSubjectForDeliverability(selectVariant(templates.direct, seed + '_d'), 'initial', cleanComp),
    valueFocused: optimizeSubjectForDeliverability(selectVariant(templates.valueFocused, seed + '_v'), 'initial', cleanComp),
    conversational: optimizeSubjectForDeliverability(selectVariant(templates.conversational, seed + '_c'), 'initial', cleanComp)
  };
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

  // 3. Subject deliverability & formatting checks
  const exclamations = (body.match(/!/g) || []).length + (subject.match(/!/g) || []).length;
  if (exclamations > 1) {
    notes.push('Excessive exclamation marks detected.');
  }
  if (subject === subject.toUpperCase() && subject.length > 8) {
    notes.push('All-caps subject line detected.');
  }
  const cleanSubjWords = subject.replace(/^(re:\s*)+/i, '').trim().split(/\s+/).filter(Boolean).length;
  if (cleanSubjWords > 5) {
    notes.push(`Subject line has ${cleanSubjWords} words; aim for 2-4 words for optimal inbox deliverability.`);
  }
  for (const phrase of BANNED_CLICHES) {
    if (lowerSubject.includes(phrase)) {
      notes.push(`Spam phrase detected in subject: "${phrase}".`);
      foundSpam = true;
    }
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

export interface SpamRiskAssessment {
  score: number; // 0 - 100 (0 = cleanest, 100 = critical spam danger)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendations: string[];
}

/**
 * Evaluates cold outreach content against modern mailbox spam heuristics
 */
export function analyzeSpamRisk(subject: string, body: string): SpamRiskAssessment {
  const flags: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  const lowerSub = (subject || '').toLowerCase();
  const lowerBody = (body || '').toLowerCase();

  // 1. High risk spam words
  const highRiskWords = [
    '100% free', 'guaranteed', 'risk-free', 'urgent', 'act now', 'apply now',
    'earn money', 'make money', 'fast cash', 'no risk', 'unlimited', 'winner',
    'credit card', 'congratulations', 'no catch', 'cancel anytime', 'call now',
    'click here', 'buy now'
  ];

  for (const word of highRiskWords) {
    if (lowerBody.includes(word) || lowerSub.includes(word)) {
      score += 25;
      flags.push(`Spam trigger phrase detected: "${word}"`);
    }
  }

  // 2. Generic cold outreach clichés
  const mediumRisk = [
    'just checking in', 'touching base', 'bumping this', 'synergy', 'game-changer',
    'special promotion', 'limited time offer'
  ];
  for (const word of mediumRisk) {
    if (lowerBody.includes(word) || lowerSub.includes(word)) {
      score += 15;
      flags.push(`Generic cliché detected: "${word}"`);
    }
  }

  // 3. Punctuation & all-caps checks
  const exclamations = (body.match(/!/g) || []).length + (subject.match(/!/g) || []).length;
  if (exclamations > 2) {
    score += 20;
    flags.push(`Multiple exclamation marks detected (${exclamations})`);
    recommendations.push('Remove exclamation marks from professional B2B outreach.');
  }

  if (subject && subject === subject.toUpperCase() && subject.length > 8) {
    score += 35;
    flags.push('All-caps subject line detected.');
    recommendations.push('Write subject lines in standard sentence case.');
  }

  // 4. Subject deliverability & brevity check
  const subjWords = lowerSub.replace(/^(re:\s*)+/i, '').trim().split(/\s+/).filter(Boolean).length;
  if (subjWords > 5) {
    score += 15;
    flags.push(`Subject line is ${subjWords} words (aim for 2-4 words for primary inbox placement).`);
    recommendations.push('Keep subject line ultra-simple (2-4 words) like "quick question" or "support for Company" to maximize inbox delivery.');
  }
  if (subject && /[?!]/.test(subject)) {
    score += 15;
    flags.push('Punctuation (! or ?) detected in subject line.');
    recommendations.push('Avoid question marks or exclamation marks in subject lines to stay out of promotional tabs.');
  }
  const subjectSpamBuzzwords = ['streamline', 'solution', 'scale', 'boost', 'supercharge', 'revolutionary', 'optimize', 'discount', 'free'];
  for (const buzz of subjectSpamBuzzwords) {
    if (lowerSub.includes(buzz)) {
      score += 20;
      flags.push(`Marketing buzzword in subject line: "${buzz}".`);
      recommendations.push('Remove sales/marketing buzzwords from subject line to avoid spam filters.');
      break;
    }
  }

  // 5. Repetitive template fingerprinting check
  if (
    lowerBody.includes('disconnected tools and manual administration frequently create bottlenecks') &&
    lowerSub.includes('digital hr & workflow automation')
  ) {
    score += 30;
    flags.push('Template matches previously flagged repetitive copy (detected by Gmail heuristic filter).');
    recommendations.push('Use dynamic variations and conversational openers to avoid identical hash matching.');
  }

  score = Math.min(100, Math.max(0, score));
  const riskLevel = score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';

  if (riskLevel === 'LOW') {
    recommendations.push('Content is clean, natural, and low risk for heuristic spam filters.');
  }

  return {
    score,
    riskLevel,
    flags,
    recommendations
  };
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

  // Dynamic seed ensuring every recipient and campaign gets distinct phrasing
  const seed = `${cleanCompany}_${context.firstName || 'team'}_${followUpNumber}_${Math.random()}`;

  // Natural, varied greetings
  const greetings = context.firstName ? [
    `Hi ${context.firstName},`,
    `Hello ${context.firstName},`,
    `Hi there ${context.firstName},`
  ] : [
    `Hi there,`,
    `Hello,`,
    `Hi ${cleanCompany} team,`
  ];

  const greeting = selectVariant(greetings, seed + '_greet');
  const subjects = generateSubjectLineVariations(cleanCompany, intent, mailTopic, seed);
  let subject = subjects.primary;
  let alternativeSubjects = [subjects.direct, subjects.valueFocused, subjects.conversational];

  if (followUpNumber > 0) {
    const rawPrev = (previousSubject || '').trim();
    const cleanBase = rawPrev.replace(/^(re:\s*)+/i, '').trim() || subjects.primary.replace(/^(re:\s*)+/i, '');
    subject = `Re: ${cleanBase}`;
    alternativeSubjects = [
      `Re: ${cleanBase}`,
      `Re: ${subjects.direct.replace(/^(re:\s*)+/i, '')}`,
      `Re: ${subjects.conversational.replace(/^(re:\s*)+/i, '')}`
    ];
  }

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
      followUpValues[intent as keyof typeof followUpValues] || followUpValues.software_solutions,
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
      insights[intent as keyof typeof insights] || insights.software_solutions,
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
      `I came across ${companyName} while looking at VCS hiring and wanted to ask you a quick question: are you planning to build the support team in-house, or would an external team assist with the workload?`,
      hasPersonalization ? 
        `I came across your work at ${companyName} and thought you might find this relevant.` :
        `I wanted to reach out about something that might be relevant for ${companyName}.`,
      hasPersonalization ? 
        `I noticed ${companyName}'s growth and wanted to share something that could be helpful.` :
        `I've been following ${companyName} and wanted to share something that caught my attention.`
    ],
    recruitment_services: [
      designation ? 
        `Saw your role as ${designation} at ${companyName} and thought this might resonate.` :
        `I wanted to reach out regarding something that might be relevant for your hiring needs.`,
      hasPersonalization ? 
        `I've been thinking about the hiring challenges facing companies like ${companyName}.` :
        `I wanted to discuss something that might help with your talent acquisition efforts.`
    ],
    software_solutions: [
      `I wanted to share something that might streamline your operations at ${companyName}.`,
      hasPersonalization ? 
        `I noticed how ${companyName} is growing and thought you might find this interesting.` :
        `I came across ${companyName} and wanted to share something that could be valuable.`
    ]
  };

  const categoryOpenings = openings[intent as keyof typeof openings] || openings.software_solutions;
  return categoryOpenings[Math.floor(Math.random() * categoryOpenings.length)];
}

// Natural value propositions without buzzwords
function generateNaturalValueProp(intent: OutreachIntent, context: any, companyName: string) {
  const { industry, rolePains } = context;
  
  const valueProp = {
    vcs: `At TaskNera, we help businesses handle day-to-day customer support, including calls, chats, emails, and follow-ups through dedicated human pods. We essentially become an extension of your team, following your processes and maintaining your service standards while you focus on growing the business.`,
    
    recruitment_services: industry === 'technology' ? 
      `We handle the entire recruitment process for tech companies - from sourcing developers to screening and coordinating interviews. It's like having a dedicated hiring team without the overhead.` :
      `We take care of end-to-end recruitment - sourcing, screening, and coordinating interviews across all types of roles. Think of it as your external hiring team that knows your standards.`,
    
    software_solutions: `We've built HR technology that actually connects the dots - recruitment, employee management, and client relationships all work together instead of being separate systems.`,
    
    ats_crm: `HireIQ reads through resumes and matches them against your job requirements automatically. Instead of spending hours reviewing CVs, you get ranked lists of qualified candidates in minutes.`,
    
    hrms_crm: `Our HRMS handles everything from employee records to payroll, and connects with your customer management. It's designed for businesses that want their people operations and client work to flow together seamlessly.`
  };

  return valueProp[intent as keyof typeof valueProp] || valueProp.software_solutions;
}

// Natural, conversational CTAs
function generateNaturalCTA(intent: OutreachIntent, companyName: string, context: any) {
  const ctas = [
    `If you're already covered, no worries at all. I thought I'd ask in case extra support capacity is useful right now.`,
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

STRICT SUBJECT LINE RULES (CRITICAL FOR INBOX PLACEMENT):
- The subject line MUST be ultra-simple: strictly 2 to 4 words (maximum 5 words). Short subjects land in the Primary Inbox; long/salesy subjects trigger spam and promotional tabs.
- Use natural lowercase or sentence case (e.g. "quick question", "quick question - ${cleanCompany}", "support for ${cleanCompany}", "hiring at ${cleanCompany}").
- NEVER use marketing buzzwords or spam triggers: avoid "streamline", "boost", "scale", "solution", "cutting-edge", "revolutionary", "optimize", "guaranteed", "save", "free", numbers, percentages (%), exclamation marks (!), or question marks (?).
- Never sound like an ad or sales pitch. Real human emails use plain, brief subjects.
- For follow-ups (followUpNumber > 0): The subject MUST strictly be "Re: <original subject>" to thread properly in the recipient's inbox.

TONE ADAPTATIONS:
- Professional: Respectful and business-appropriate while remaining conversational
- Consultative: Advisory and helpful, focusing on their challenges and solutions
- Direct: Clear and to-the-point while maintaining warmth
- Friendly: Approachable and personable while staying professional

OUTPUT FORMAT - Return valid JSON only:
{
  "subject": "Ultra-simple 2-4 word subject line (e.g. 'quick question - Company' or 'Re: <original subject>' for follow-ups)",
  "body": "Conversational email body with natural paragraph breaks",
  "directSubject": "2-3 word direct subject (e.g. 'Company / support')",
  "valueFocusedSubject": "2-4 word simple subject (e.g. 'support for Company')",
  "conversationalSubject": "1-3 word conversational subject (e.g. 'quick question')",
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
${previousSubject ? (followUpNumber > 0 ? `Original Subject to Thread With: "${previousSubject}" (Set subject to "Re: ${previousSubject.replace(/^(re:\s*)+/i, '')}")` : `Previous Subject: "${previousSubject}"`) : ''}
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

  const rawSubject = (parsed.subject || '').replace(/^["']|["']$/g, '').trim();
  const stage: 'initial' | 'followup_1' | 'followup_2' | 'followup_3' =
    followUpNumber === 1 ? 'followup_1' : followUpNumber === 2 ? 'followup_2' : followUpNumber === 3 ? 'followup_3' : 'initial';
  let cleanSubject = optimizeSubjectForDeliverability(rawSubject, stage, cleanCompany);
  if (followUpNumber > 0 && previousSubject) {
    const cleanBase = previousSubject.replace(/^(re:\s*)+/i, '').trim();
    cleanSubject = `Re: ${cleanBase || cleanSubject.replace(/^(re:\s*)+/i, '')}`;
  }
  const cleanBody = sanitizeEmailBody(parsed.body || '');

  // Variations
  const defaultVars = generateSubjectLineVariations(cleanCompany, intent, mailTopic);
  const altSubjects = [
    optimizeSubjectForDeliverability(parsed.directSubject || defaultVars.direct, stage, cleanCompany),
    optimizeSubjectForDeliverability(parsed.valueFocusedSubject || defaultVars.valueFocused, stage, cleanCompany),
    optimizeSubjectForDeliverability(parsed.conversationalSubject || defaultVars.conversational, stage, cleanCompany)
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
