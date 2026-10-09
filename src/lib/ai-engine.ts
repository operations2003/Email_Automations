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

// Generates professional alternative subject lines (Direct, Value-Focused, Conversational)
export function generateSubjectLineVariations(
  company: string,
  intent: OutreachIntent,
  topic?: string,
  seedKey?: string
): { primary: string; direct: string; valueFocused: string; conversational: string } {
  const cleanComp = company.trim() || 'your team';
  const seed = seedKey || `${cleanComp}_${intent}`;

  switch (intent) {
    case 'vcs': {
      const primaries = [
        `virtual customer support pods for ${cleanComp}`,
        `dedicated multi-channel support for ${cleanComp}`,
        `customer inquiry coverage & SLA delivery for ${cleanComp}`,
        `omnichannel customer support operations for ${cleanComp}`
      ];
      return {
        primary: selectVariant(primaries, seed),
        direct: `Dedicated customer support operations for ${cleanComp}`,
        valueFocused: `SLA-aligned support across chat, voice & email for ${cleanComp}`,
        conversational: `Handling customer enquiries & support at ${cleanComp}`
      };
    }
    case 'recruitment_services': {
      const primaries = [
        `streamlining talent acquisition at ${cleanComp}`,
        `recruitment pipeline support for ${cleanComp}`,
        `accelerating hiring turnaround for ${cleanComp}`,
        `candidate sourcing & shortlisting support for ${cleanComp}`
      ];
      return {
        primary: selectVariant(primaries, seed),
        direct: `End-to-end recruitment & candidate shortlisting for ${cleanComp}`,
        valueFocused: `Accelerating quality hiring pipelines for ${cleanComp}`,
        conversational: `Quick question about ${cleanComp}'s hiring pipeline`
      };
    }
    case 'software_solutions': {
      const primaries = [
        `streamlining business workflows at ${cleanComp}`,
        `operational visibility & HR technology for ${cleanComp}`,
        `connecting employee workflows at ${cleanComp}`,
        `workflow automation & workforce operations for ${cleanComp}`,
        `digital HR & operational visibility at ${cleanComp}`
      ];
      return {
        primary: selectVariant(primaries, seed),
        direct: `HR technology & operations dashboards for ${cleanComp}`,
        valueFocused: `Reducing administrative HR effort at ${cleanComp}`,
        conversational: `HR technology & workflow visibility at ${cleanComp}`
      };
    }
    case 'ats_crm': {
      const primaries = [
        `HireIQ: AI recruitment intelligence for ${cleanComp}`,
        `accelerating candidate matching at ${cleanComp}`,
        `resume screening & candidate evaluation for ${cleanComp}`,
        `screening turnaround & candidate matching for ${cleanComp}`
      ];
      return {
        primary: selectVariant(primaries, seed),
        direct: `Resume parsing & candidate matching for ${cleanComp}`,
        valueFocused: `Accelerating candidate shortlisting decisions at ${cleanComp}`,
        conversational: `Quick question about ${cleanComp}'s candidate screening workflow`
      };
    }
    case 'hrms_crm': {
      const primaries = [
        `connected HRMS & workforce operations for ${cleanComp}`,
        `centralizing employee management at ${cleanComp}`,
        `unifying HR records and CRM workflows for ${cleanComp}`,
        `workforce visibility & employee operations at ${cleanComp}`
      ];
      return {
        primary: selectVariant(primaries, seed),
        direct: `Employee lifecycle & CRM workflows at ${cleanComp}`,
        valueFocused: `Centralizing HR management & operations at ${cleanComp}`,
        conversational: `Managing employee workflows and CRM at ${cleanComp}`
      };
    }
    case 'pain_screening_bottleneck':
      return {
        primary: `${cleanComp} shortlist turnaround`,
        direct: `Candidate resume evaluation for ${cleanComp}`,
        valueFocused: `Eliminating manual screening bottlenecks at ${cleanComp}`,
        conversational: `Hours spent reviewing CVs at ${cleanComp}`
      };
    case 'high_volume':
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
    default: {
      const primaries = [
        `saving recruiter hours on CV screening at ${cleanComp}`,
        `candidate screening turnaround for ${cleanComp}`,
        `shortening resume review time at ${cleanComp}`
      ];
      return {
        primary: selectVariant(primaries, seed),
        direct: `Candidate screening turnaround for ${cleanComp}`,
        valueFocused: `Saving 8-10 hours weekly on resume review at ${cleanComp}`,
        conversational: `Quick note regarding ${cleanComp}'s candidate review process`
      };
    }
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

  // 4. Repetitive template fingerprinting check
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
  const { firstName, designation } = parseRecipientDetails(recipientName);

  // Dynamic seed ensuring every recipient and campaign gets distinct phrasing
  const seed = `${cleanCompany}_${firstName || 'team'}_${followUpNumber}_${Math.random()}`;

  // Natural greeting
  const salutation = firstName ? `Hi ${firstName},` : `Hi ${cleanCompany} team,`;

  const subjects = generateSubjectLineVariations(cleanCompany, intent, mailTopic, seed);
  const subject = subjects.primary;
  const alternativeSubjects = [subjects.direct, subjects.valueFocused, subjects.conversational];

  let bodyContent = '';
  let emailType = '';

  if (followUpNumber === 0) {
    emailType = `initial_${intent}`;

    let opening = '';
    let valuePara = '';
    let cta = '';

    switch (intent) {
      case 'vcs': {
        const openings = [
          `I came across ${cleanCompany} while looking at VCS hiring and wanted to ask you a quick question: are you planning to build the support team in-house, or would an external team assist with the workload?`,
          designation
            ? `I noticed your role leading ${designation} at ${cleanCompany}. Delivering consistent, responsive customer support across channels often places substantial pressure on internal teams.`
            : `Reaching out regarding how ${cleanCompany} manages inbound customer inquiries and support coverage across channels. Maintaining high service quality while handling fluctuating volume can be an operational challenge.`,
          `Reaching out regarding ${cleanCompany}'s customer engagement operations. Providing 24/7 responsiveness across live chat, voice, and email without overworking internal teams is a common challenge for scaling organizations.`,
          `Curious how your team at ${cleanCompany} balances customer inquiry volume with fast response SLAs. Scaling internal support pods can quickly create bandwidth constraints.`
        ];
        const values = [
          `At TaskNera, we help businesses handle day-to-day customer support, including calls, chats, emails, and follow-ups through dedicated human pods.`,
          `Through TaskNera's Virtual Customer Support (VCS), we provide dedicated, human-led support teams across voice, live chat, email, WhatsApp, and social media. Our teams handle enquiries, issue resolution, and follow-ups backed by structured workflows, continuous quality monitoring, and strict SLA-aligned delivery.`,
          `TaskNera provides managed customer support pods operating across chat, email, voice, and WhatsApp. Our teams integrate directly into your existing support tools, handling inbound inquiries and tier-1 resolutions with strict SLA compliance.`,
          `We partner with growing businesses to provide dedicated, professionally trained support pods. From managing surge volume to providing after-hours coverage, our teams ensure every customer inquiry receives prompt, high-touch resolution.`
        ];
        const ctas = [
          `If you're already covered, no worries at all. I thought I'd ask in case extra support capacity is useful for ${cleanCompany} right now.`,
          `Would you be open to a brief 5-minute introductory chat this week to explore if extra support capacity could help ${cleanCompany}?`,
          `Would you be open to a quick chat to see how our dedicated support pods compare with your current setup?`,
          `Would it make sense to connect for a few minutes this week to share how we help teams streamline their customer support operations?`
        ];
        opening = selectVariant(openings, seed + '_op');
        valuePara = selectVariant(values, seed + '_val');
        cta = selectVariant(ctas, seed + '_cta');
        break;
      }

      case 'recruitment_services': {
        const openings = [
          designation
            ? `I noticed your work as ${designation} at ${cleanCompany}. Keeping up with hiring demands across specialized roles while maintaining thorough candidate screening requires significant team bandwidth.`
            : `Reaching out regarding ${cleanCompany}'s hiring initiatives. Sourcing and screening qualified talent across active requisitions often pulls hiring managers away from strategic priorities.`,
          `Reaching out regarding ${cleanCompany}'s recruitment operations. Finding pre-qualified talent across competitive positions while keeping time-to-hire low is a key priority for expanding teams.`,
          `Curious how your team at ${cleanCompany} manages candidate pipelines across upcoming technical and operational requisitions.`
        ];
        const values = [
          `TaskNera supports end-to-end recruitment across permanent, contract, executive, IT and non-IT, and high-volume hiring. From candidate sourcing and screening to candidate shortlisting and interview coordination, we help build qualified talent pipelines and streamline recruitment operations.`,
          `Through our specialized recruitment practice, we deliver pre-screened shortlists across permanent and contract roles. Our consultants handle sourcing, technical screening, and evaluation so your hiring leaders only spend time interviewing top matches.`,
          `We support organizations by building tailored candidate shortlists within days, accelerating placement velocity while ensuring strict qualification alignment.`
        ];
        const ctas = [
          `Would you be open to a short 10-minute conversation to explore how we could support ${cleanCompany}'s current talent requirements?`,
          `Would you be open to a brief call this week to compare notes on your current hiring priorities?`,
          `Would it be helpful to see a sample talent pipeline for the roles ${cleanCompany} is currently looking to fill?`
        ];
        opening = selectVariant(openings, seed + '_op');
        valuePara = selectVariant(values, seed + '_val');
        cta = selectVariant(ctas, seed + '_cta');
        break;
      }

      case 'software_solutions': {
        const openings = [
          `I noticed ${cleanCompany}'s growth and wanted to reach out regarding how your team manages business workflows and workforce operations. As teams scale, disjointed software tools frequently create administrative friction.`,
          `Reaching out to see how ${cleanCompany} currently manages operational visibility across people management and business workflows. Connecting separate systems often frees up substantial internal bandwidth.`,
          `Curious how your team at ${cleanCompany} handles workflow automation and employee administration. Many growing companies find that manual spreadsheets and disparate tools consume significant operational hours.`,
          `Wanted to check in regarding ${cleanCompany}'s approach to workforce operations and digital HR systems. Centralizing day-to-day administrative tasks can free up substantial bandwidth for core priorities.`
        ];
        const values = [
          `TaskNera delivers HR technology and digital solutions including recruitment intelligence, HRMS platforms, employee self-service portals, workforce dashboards, and workflow automation. Our integrated digital ecosystem connects recruitment pipelines, employee management, and client relationships to improve visibility and reduce repetitive administrative effort.`,
          `Through TaskNera's digital solutions, we help organizations connect recruitment pipelines, employee lifecycle records, and client workflows into a cohesive ecosystem that reduces repetitive administrative tasks and enhances team visibility.`,
          `We support growing organizations with modular HR technology and business workflow systems—centralizing employee records, onboarding, leave management, and reporting to simplify day-to-day operations.`
        ];
        const ctas = [
          `Would it be helpful if I shared a brief 2-minute overview showing how we streamline these operations for growing businesses?`,
          `Would you be open to a quick 10-minute introductory conversation this week to see if this aligns with ${cleanCompany}'s operational goals?`,
          `Would it be helpful if I shared a brief 90-second summary of how we help companies connect their people and workflow operations?`
        ];
        opening = selectVariant(openings, seed + '_op');
        valuePara = selectVariant(values, seed + '_val');
        cta = selectVariant(ctas, seed + '_cta');
        break;
      }

      case 'ats_crm': {
        const openings = [
          designation
            ? `I noticed your recruitment focus at ${cleanCompany}. When managing competitive requisitions, recruitment teams frequently spend hours sifting through resumes to evaluate qualifications against role criteria.`
            : `When managing active requisitions at ${cleanCompany}, manual resume screening often becomes one of the slowest stages before candidate interviews.`,
          `Curious how your recruiting desk at ${cleanCompany} currently handles high-volume resume screening on specialized job descriptions.`
        ];
        const values = [
          `HireIQ by TaskNera is an AI-powered recruitment intelligence platform that supports job-description analysis, resume parsing, candidate-to-role matching, weighted scoring, and structured candidate evaluation. Combined with our CRM integration, it connects client accounts, hiring requirements, and communication history directly with recruitment activities for end-to-end visibility.`,
          `HireIQ automatically screens and ranks incoming CVs against your mandatory requirements in seconds, providing objective match scores and cutting shortlist preparation time by up to 70%.`
        ];
        const ctas = [
          `Would you be open to seeing a 90-second walkthrough of how HireIQ evaluates candidates and accelerates shortlisting?`,
          `Would you be open to a quick 10-minute demonstration on a live requisition?`
        ];
        opening = selectVariant(openings, seed + '_op');
        valuePara = selectVariant(values, seed + '_val');
        cta = selectVariant(ctas, seed + '_cta');
        break;
      }

      case 'hrms_crm': {
        const openings = [
          `Tracking ${cleanCompany}'s growth—managing employee records, onboarding, leave, and payroll alongside client relationships often requires toggling between disconnected software tools.`,
          `Reaching out regarding how ${cleanCompany} manages internal people operations. Consolidating employee lifecycle data with daily business workflows helps eliminate operational blind spots.`
        ];
        const values = [
          `TaskNera's HRMS centralizes essential employee lifecycle workflows—including employee records, onboarding and offboarding, attendance, leave, payroll, performance, and training. Connected with our CRM integration, customer accounts and service requirements link directly with workforce operations to create a cohesive business ecosystem.`,
          `Our HRMS platform unifies employee records, onboarding, payroll processing, and attendance with CRM workflows, giving your leadership complete visibility in a single interface.`
        ];
        const ctas = [
          `Would you be open to a quick 10-minute walkthrough to see how an integrated setup could simplify ${cleanCompany}'s daily operations?`,
          `Would it make sense to connect for 5 minutes this week to explore if this could streamline your team's administrative workflow?`
        ];
        opening = selectVariant(openings, seed + '_op');
        valuePara = selectVariant(values, seed + '_val');
        cta = selectVariant(ctas, seed + '_cta');
        break;
      }

      case 'pain_screening_bottleneck':
        opening = `Managing active hiring requisitions at ${cleanCompany} often leads to consultants spending hours filtering through mismatched resumes just to identify a few viable candidates.`;
        valuePara = `Our AI recruitment intelligence platform automates first-level screening by matching CVs directly against your exact job specifications. It instantly highlights matching skills, flags missing prerequisites, and ranks top applicants so your team only spends interview time on qualified candidates.`;
        cta = `Would you be open to checking out a quick 2-minute example of how it operates on a live requisition?`;
        break;

      case 'high_volume':
        opening = `Curious how your hiring team at ${cleanCompany} currently manages high-volume applicant intake. When candidate volume surges, valuable talent pools often sit underutilized because re-screening past profiles manually takes too long.`;
        valuePara = `Our platform processes large batches of resumes in minutes, evaluating candidates against defined criteria and auto-ranking talent pools. This allows your team to reactivate existing candidates and surface top applicants before competitors even complete their initial review.`;
        cta = `Is managing high candidate volume something your recruitment team is looking to streamline this quarter?`;
        break;

      case 'recruiter_productivity':
        opening = `In fast-moving recruitment, submitting vetted shortlists to hiring managers quickly often determines who secures the best talent.`;
        valuePara = `Our recruitment intelligence platform standardizes candidate evaluation against your criteria, giving recruiters consistent matching scores in seconds. This eliminates manual resume reading, shortens submittal turnaround from days to hours, and frees up your team to focus on candidate engagement.`;
        cta = `Would you be open to a brief 10-minute introductory call to compare notes on your current workflow?`;
        break;

      case 'soft_cta_curiosity':
      case 'time_saving':
      default:
        opening = designation
          ? `I noticed your role as ${designation} at ${cleanCompany} and wanted to reach out regarding your recruitment and candidate review process.`
          : `Reaching out regarding ${cleanCompany}'s recruitment operations and how your team handles candidate evaluation.`;
        valuePara = `If your team spends significant time manually reviewing CVs against job specifications, our platform automates that initial screening pass. It parses resumes, highlights key skill alignments, and ranks applicants objectively, typically saving recruiters 8 to 10 hours every week.`;
        cta = `Would you be open to a brief 10-minute walkthrough to see if this could save your team time this quarter?`;
        break;
    }

    bodyContent = [salutation, opening, valuePara, cta].join('\n\n');
  } else if (followUpNumber === 1) {
    // STAGE 1 (Day 2-3): Respectful Reminder & Problem Re-frame (50-75 words)
    emailType = 'follow_up_1_problem_reframe';

    const hookVariations = [
      `Following up on my note from earlier this week regarding ${cleanCompany}'s workflow.`,
      `Circling back briefly on my previous email regarding ${cleanCompany}'s operations.`,
      `Quick follow-up on my note from a couple of days ago.`
    ];
    const hook = selectVariant(hookVariations, seed + '_fu1hook');
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

// Master OpenAI generator implementing consultative B2B cold email standards
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
  const { firstName, designation } = parseRecipientDetails(recipientName);

  const stageDescription =
    followUpNumber === 0
      ? 'Initial Cold Outreach Email (STRICTLY 85 to 135 words. Write 2-3 short, clean paragraphs. 1: Personalized professional greeting and specific reason for reaching out based on verified role or company context. 2: Practical business relevance and value proposition without hype or buzzwords. 3: Single low-friction call to action asking if they would be open to a 10-minute conversation or brief 2-minute walkthrough. Zero spam clichés, zero aggressive sales language).'
      : followUpNumber === 1
      ? 'Follow-Up 1 (STRICTLY 50 to 75 words. Respectful reminder referencing previous note without saying "just checking in" or guilt-tripping. Re-frames the core operational friction point thoughtfully and asks a simple question).'
      : followUpNumber === 2
      ? 'Follow-Up 2 (STRICTLY 55 to 80 words. Shares a concise, realistic workflow insight or measurable practical benefit. Offers a brief 1-page summary or 2-minute overview).'
      : followUpNumber === 3
      ? 'Follow-Up 3 (STRICTLY 40 to 60 words. Simple, respectful qualifying question asking if this area is an active priority this quarter, or if their current workflow is already meeting their needs).'
      : 'Follow-Up 4 (STRICTLY 35 to 50 words. Polite permission-based breakup closing loop. Assumes timing is not right, respectfully steps back with zero pressure, leaves contact details open for the future).';

  const systemPrompt = `You are an elite B2B sales copywriter and outbound strategist for TaskNera HR Solutions (https://tasknera.com).
You write natural, consultative, highly professional cold emails that sound like they were written by an experienced enterprise sales consultant.

CORE KNOWLEDGE BASE (Adapt seamlessly based on the selected offering / mailTopic):
1. Virtual Customer Support (VCS): Dedicated, human-led customer support across voice, live chat, email, WhatsApp, and social media. Helps businesses manage enquiries, resolve issues, handle follow-ups, and maintain service quality through structured workflows, quality monitoring, and SLA-aligned delivery.
2. Recruitment & Talent Acquisition: End-to-end recruitment across permanent, contract, executive, IT and non-IT, and high-volume hiring. From candidate sourcing and screening to shortlisting and interview coordination, building qualified talent pipelines and streamlining recruitment operations.
3. HR Technology & Digital Solutions / Software Solutions: Technology-enabled solutions for recruitment and people management: recruitment intelligence, HRMS platforms, employee self-service portals, workforce dashboards, analytics, and workflow automation. In-house CRM connects client relationships, recruitment pipelines, and workforce operations.
4. HireIQ — ATS & Recruitment Intelligence (ATS + CRM Integration): AI-powered recruitment intelligence platform supporting job-description analysis, resume parsing, candidate-to-role matching, weighted scoring, ranking, and structured candidate evaluation. Planned CRM connects client accounts, hiring requirements, communication history, follow-ups, and business opportunities with recruitment activities.
5. HRMS & Employee Lifecycle Management (HRMS + CRM Integration): Centralized employee lifecycle management covering employee records, onboarding and offboarding, attendance, leave, payroll, performance, and training. Planned CRM connects customer accounts, business opportunities, and service requirements with workforce operations for a unified business ecosystem.
6. Custom Offerings: Tailored business solutions as specified in the outreach focus.

STRICT WRITING & COMPLIANCE RULES:
- TONE: Professional, conversational, respectful business English.
- LENGTH: Initial emails must strictly be between 80 and 135 words. Follow-ups between 40 and 80 words.
- NO SPAM CLICHES: Never use "I hope this email finds you well", "Hope you're doing well", "I am writing to introduce", "We would love to connect", "Touching base", "Just checking in", "Bumping this to the top", "10x", "Revolutionary", "Guaranteed results", "Urgent", or artificial urgency.
- NO FAKE INFORMATION: Never invent company research, customer achievements, or previous calls that did not occur. If prospect data is limited, write a clear, relevant email without forced personalization.
- NO PLACEHOLDERS: Never output placeholders like {{company}}, [Your Name], or similar tokens.
- DO NOT include signature blocks or placeholders like [Best regards, Name] at the end, as the system attaches configured signatures automatically.
- NO MARKDOWN: Output clean plain text. Do not use asterisks (**) for bolding, bullet points, or markdown code blocks.
- STRUCTURE: Greeting on its own line, followed by 2 to 3 concise paragraphs separated by double newlines, ending with ONE clear conversational question.

OUTPUT FORMAT:
Return strictly valid JSON only:
{
  "subject": "Concise, natural, relevant subject line in lower-case or standard title",
  "body": "Clean email body text with paragraph separation, without signature block",
  "directSubject": "Direct & professional alternative subject line",
  "valueFocusedSubject": "Value-focused alternative subject line",
  "conversationalSubject": "Conversational alternative subject line",
  "emailType": "${intent}_${followUpNumber}",
  "tone": "${tone}"
}`;

  const userPrompt = `Prospect Information:
Company Name: ${cleanCompany}
Recipient Name: ${recipientName || 'Not specified'}
Recipient First Name: ${firstName || 'Not specified'}
Designation / Role: ${designation || 'Not specified'}
Company Website: ${companyWebsite || 'Not specified'}
Service / Mail Topic: ${mailTopic || 'General Solutions'}
Outreach Reason / Specific Focus: "${reason}"
Angle Category: ${intent}
Stage: ${stageDescription}
Desired Tone: ${tone}
Previous Subject (Do NOT repeat): "${previousSubject || 'None'}"
Previous Emails in Thread: ${JSON.stringify(previousEmails)}`;

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
