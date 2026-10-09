import { EmailGenerationPayload, GeneratedEmailResult } from '../types/outreach.js';

// Classification angles for the AI Outreach & Platform Solutions
export type OutreachIntent =
  | 'pain_screening_bottleneck'  // Angle 1: Recruiters drowning in CVs, manual screening drag
  | 'time_saving'                // Angle 2: Saving 8-10 hours/week per recruiter, faster submittals
  | 'high_volume'                // Angle 3: Large applicant batches, candidate pool auto-ranking
  | 'recruiter_productivity'     // Angle 4: Higher billing capacity, consistent candidate scores
  | 'soft_cta_curiosity'         // Angle 5: Low-friction 90-sec example, conversational check
  | 'general_ats_intelligence'   // General recruitment intelligence & matching
  | 'vcs'                        // Topic 1: VCS (TaskNera flexible workforce & staffing support)
  | 'recruitment_services'       // Topic 2: Recruitment Services (TaskNera streamlined candidate sourcing & shortlisting)
  | 'software_solutions'         // Topic 3: Software Solutions (TaskNera tech-driven tools for HR, CRM & recruitment intelligence)
  | 'ats_crm'                    // Topic 4: ATS + CRM Application — HireIQ by TaskNera (AI recruitment intelligence & CRM)
  | 'hrms_crm';                  // Topic 5: HRMS + CRM Application (Integrated employee management & CRM workflows)

export function classifyIntent(reason: string, mailTopic?: string): OutreachIntent {
  const t = (mailTopic || '').toLowerCase();
  if (t.includes('vcs')) return 'vcs';
  if (t.includes('recruitment')) return 'recruitment_services';
  if (t.includes('software')) return 'software_solutions';
  if (t.includes('ats') || t.includes('hireiq')) return 'ats_crm';
  if (t.includes('hrms')) return 'hrms_crm';

  const r = reason.toLowerCase();
  if (r.includes('vcs') || r.includes('flexible workforce') || r.includes('staffing support') || r.includes('workforce planning')) return 'vcs';
  if (r.includes('recruitment service') || r.includes('streamline their recruitment') || r.includes('screening and shortlisting') || r.includes('talent acquisition')) return 'recruitment_services';
  if (r.includes('software solution') || r.includes('technology-driven software') || r.includes('digital tools') || r.includes('simplify workflows')) return 'software_solutions';
  if (r.includes('hireiq') || r.includes('ats + crm') || r.includes('ats and crm') || (r.includes('ats') && r.includes('crm'))) return 'ats_crm';
  if (r.includes('hrms + crm') || r.includes('hrms and crm') || r.includes('hrms')) return 'hrms_crm';

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

  switch (intent) {
    case 'vcs':
      return {
        primary: `flexible staffing support for ${cleanComp}`,
        direct: `Workforce planning and staffing support for ${cleanComp}`,
        valueFocused: `Scaling specialized talent capacity at ${cleanComp}`,
        conversational: `Quick question regarding ${cleanComp}'s staffing requirements`
      };
    case 'recruitment_services':
      return {
        primary: `streamlining recruitment at ${cleanComp}`,
        direct: `Candidate sourcing & shortlisting support for ${cleanComp}`,
        valueFocused: `Reducing hiring cycle effort for ${cleanComp}`,
        conversational: `Quick question about ${cleanComp}'s candidate shortlisting`
      };
    case 'software_solutions':
      return {
        primary: `digital tools & workflow efficiency for ${cleanComp}`,
        direct: `Workflow automation solutions for ${cleanComp}`,
        valueFocused: `Reducing manual operational tasks at ${cleanComp}`,
        conversational: `Exploring software efficiency at ${cleanComp}`
      };
    case 'ats_crm':
      return {
        primary: `cv screening & candidate matching for ${cleanComp}`,
        direct: `HireIQ: AI candidate evaluation for ${cleanComp}`,
        valueFocused: `Cutting manual CV screening hours at ${cleanComp}`,
        conversational: `Quick question about ${cleanComp}'s candidate review process`
      };
    case 'hrms_crm':
      return {
        primary: `integrated HRMS & CRM for ${cleanComp}`,
        direct: `Employee records & CRM workflow management at ${cleanComp}`,
        valueFocused: `Simplifying HR administration and client tracking at ${cleanComp}`,
        conversational: `Managing HR and customer workflows at ${cleanComp}`
      };
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
  const { firstName, designation } = parseRecipientDetails(recipientName);

  // Natural greeting
  const salutation = firstName ? `Hi ${firstName},` : `Hi ${cleanCompany} team,`;

  const subjects = generateSubjectLineVariations(cleanCompany, intent, mailTopic);
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
      case 'vcs':
        opening = designation
          ? `I noticed your role leading ${designation} initiatives at ${cleanCompany}. Managing specialized talent demands across active projects often stretches internal bandwidth.`
          : `I am reaching out regarding how ${cleanCompany} manages fluctuating talent and project capacity. As requirements expand, sourcing and deploying dependable talent quickly can become a significant operational bottleneck.`;
        valuePara = `Through TaskNera HR Solutions' VCS offering, we provide flexible workforce and staffing support designed to scale up alongside your project timelines. Whether you need specialized technical talent or dedicated operational pods, we handle the talent qualification so your core team can focus on execution without recruitment delays.`;
        cta = `Would you be open to a brief 10-minute introductory conversation this Thursday or Friday to see if our talent roster aligns with your upcoming plans?`;
        break;

      case 'recruitment_services':
        opening = designation
          ? `I noticed your work as ${designation} at ${cleanCompany}. Keeping up with hiring demands while maintaining quality candidate screening requires considerable internal effort.`
          : `Reaching out regarding ${cleanCompany}'s ongoing hiring activity. Sifting through high volumes of applicants to surface qualified candidates often pulls recruiters and hiring managers away from core deliverables.`;
        valuePara = `TaskNera HR Solutions provides end-to-end recruitment support—from proactive sourcing to rigorous preliminary screening. We deliver vetted, role-ready candidate shortlists directly aligned with your specifications, reducing your internal hiring cycle and ensuring you only interview candidates who meet your criteria.`;
        cta = `Would you be open to a short 10-minute conversation to explore how we could support ${cleanCompany}'s current talent search?`;
        break;

      case 'software_solutions':
        opening = `I am reaching out to see how ${cleanCompany} currently approaches workflow coordination across internal operations and HR. Disconnected tools and manual administrative tasks often introduce friction as teams scale.`;
        valuePara = `TaskNera HR Solutions builds technology-driven digital tools tailored to streamline day-to-day operations, human resource workflows, and customer management. By automating routine handoffs and centralizing key records, we help organizations eliminate redundant tasks and maintain clear operational visibility.`;
        cta = `Would it be helpful if I shared a brief 2-minute overview showing how we simplify these workflows for growing teams?`;
        break;

      case 'ats_crm':
        opening = designation
          ? `I noticed your team's recruitment focus at ${cleanCompany}. When managing competitive requisitions, recruiters often spend hours each day manually cross-referencing candidate CVs against complex job criteria.`
          : `When managing active requisitions at ${cleanCompany}, manual resume screening often becomes one of the slowest stages before candidate interviews.`;
        valuePara = `We built HireIQ by TaskNera to solve this exact bottleneck. Our platform evaluates incoming resumes against your defined job descriptions, generates transparent ATS matching scores, and flags missing mandatory skills in seconds. Combined with built-in candidate CRM tracking, it keeps your pipeline organized without the manual spreadsheet drag.`;
        cta = `Would you be open to seeing a 90-second walkthrough of how HireIQ matches resumes against a live job description?`;
        break;

      case 'hrms_crm':
        opening = `Tracking ${cleanCompany}'s operational growth—coordinating employee administration alongside customer management often means juggling separate, disconnected software systems.`;
        valuePara = `TaskNera HR Solutions offers an integrated HRMS and CRM platform that unifies core workforce activities—such as attendance, leave records, and employee profiles—with structured customer and lead management. This eliminates double data entry, reduces administrative overhead, and gives leadership a single, coherent view of daily operations.`;
        cta = `Would you be open to a quick 10-minute walkthrough to see how an integrated setup could simplify ${cleanCompany}'s daily operations?`;
        break;

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

    const hook = `Following up on my note from earlier this week regarding ${cleanCompany}'s workflow.`;
    let contextNote = '';

    if (intent === 'ats_crm' || intent === 'pain_screening_bottleneck' || intent === 'time_saving') {
      contextNote = `One pattern we frequently see in recruitment teams is that over 60% of screening time is spent reviewing applicants who do not meet the core mandatory requirements. If your recruiters could cut that first review pass down to seconds, would that meaningfully help your quarterly hiring goals?`;
    } else if (intent === 'vcs') {
      contextNote = `Scaling project capacity often brings unexpected recruitment overhead. Having pre-qualified staffing support ready to deploy can make the difference between hitting sprint milestones on time or delaying deliverables.`;
    } else if (intent === 'hrms_crm') {
      contextNote = `Managing HR records in one tool and client interactions in another often leads to duplicated administrative effort and blind spots between teams.`;
    } else {
      contextNote = `Finding the right balance between operational speed and thorough candidate evaluation remains a major priority for growing teams.`;
    }

    const cta = `Would you be open to a brief 5-minute conversation later this week to see if there's a practical fit?`;
    bodyContent = [salutation, hook, contextNote, cta].join('\n\n');
  } else if (followUpNumber === 2) {
    // STAGE 2 (Day 4-6): Micro Workflow Insight & Proof (55-80 words)
    emailType = 'follow_up_2_micro_proof';

    const leadIn = `I wanted to share a brief practical example that may be relevant to ${cleanCompany}:`;
    let insight = '';

    if (intent === 'ats_crm' || intent === 'pain_screening_bottleneck' || intent === 'time_saving') {
      insight = `A staffing team recently tested HireIQ on several active technical requisitions. By automatically scoring resumes against defined criteria and flagging missing skills upfront, they reduced their average shortlist review time from two days to under three hours.`;
    } else if (intent === 'vcs') {
      insight = `An engineering organization partnering with our VCS team was able to deploy four specialized contributors within five days, allowing them to deliver their quarterly product release without pausing their internal hiring pipeline.`;
    } else if (intent === 'hrms_crm') {
      insight = `A growing services firm unified their employee records and client tracking onto our integrated platform, eliminating manual reconciliation and saving their operations manager roughly six hours each week.`;
    } else {
      insight = `Teams using our solutions typically reduce their manual administrative coordination by over 50% within the first month of implementation.`;
    }

    const cta = `Would it be useful if I sent over a short 1-page summary of how they structured it?`;
    bodyContent = [salutation, leadIn, insight, cta].join('\n\n');
  } else if (followUpNumber === 3) {
    // STAGE 3 (Day 7-9): Simple Binary Qualifying Question (40-60 words)
    emailType = 'follow_up_3_qualifying_question';

    const question = `Quick question regarding ${cleanCompany}: is streamlining your current ${
      intent === 'ats_crm' ? 'resume screening and candidate tracking' :
      intent === 'vcs' ? 'staffing and talent capacity' :
      intent === 'hrms_crm' ? 'HR and CRM workflows' : 'hiring operations'
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

  const systemPrompt = `You are an elite B2B sales copywriter and outbound strategist for TaskNera HR Solutions (https://tasknera.io).
You write natural, consultative, highly professional cold emails that sound like they were written by an experienced enterprise sales consultant.

CORE KNOWLEDGE BASE (Adapt seamlessly based on the selected offering / mailTopic):
1. VCS: Flexible workforce and staffing support, on-demand specialized contributors and engineering pods, scalable workforce planning that eliminates recruitment lag.
2. Recruitment Services: End-to-end candidate sourcing, screening, and shortlisting, delivering vetted candidate shortlists to reduce hiring effort and time-to-hire.
3. Software Solutions: Digital tools and workflow automation for HR, CRM, and operational coordination, eliminating manual administrative tasks and data fragmentation.
4. ATS + CRM Application — HireIQ by TaskNera: AI-powered candidate evaluation, automated JD parsing, transparent ATS matching scores, missing skill detection, and structured candidate CRM pipelines. Reduces manual resume review time from days to hours.
5. HRMS + CRM Application: Integrated employee management (attendance, leave, records, payroll) combined with CRM (lead & client interaction tracking) for complete operational visibility and reduced administrative overhead.
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
