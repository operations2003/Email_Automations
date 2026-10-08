import { EmailGenerationPayload, GeneratedEmailResult } from '@/types/outreach';

// Classification angles for the AI Outreach & Platform Solutions
export type OutreachIntent =
  | 'pain_screening_bottleneck'  // Angle 1: Recruiters drowning in CVs, manual screening drag
  | 'time_saving'                // Angle 2: Saving 8-10 hours/week per recruiter, faster submittals
  | 'high_volume'                // Angle 3: Large applicant batches, candidate pool auto-ranking
  | 'recruiter_productivity'     // Angle 4: Higher billing capacity, consistent candidate scores
  | 'soft_cta_curiosity'         // Angle 5: Low-friction 90-sec example, conversational check
  | 'general_ats_intelligence'   // General recruitment intelligence & matching
  | 'vcs'                        // Topic: VCS (Version Control Systems / Engineering Workflows)
  | 'recruitment_services'       // Topic: Recruitment Services (Full-cycle talent acquisition & staffing)
  | 'software_solutions'         // Topic: Software Solutions (Custom engineering & digital products)
  | 'ats_crm'                    // Topic: ATS + CRM app (Unified candidate tracking & client CRM)
  | 'hrms_crm';                  // Topic: HRMS + CRm (Integrated HR management & customer CRM)

export function classifyIntent(reason: string, mailTopic?: string): OutreachIntent {
  const t = (mailTopic || '').toLowerCase();
  if (t.includes('vcs')) return 'vcs';
  if (t.includes('recruitment')) return 'recruitment_services';
  if (t.includes('software')) return 'software_solutions';
  if (t.includes('ats')) return 'ats_crm';
  if (t.includes('hrms')) return 'hrms_crm';

  const r = reason.toLowerCase();
  if (r.includes('vcs') || r.includes('version control') || r.includes('repository')) return 'vcs';
  if (r.includes('recruitment services') || r.includes('staffing services') || r.includes('talent acquisition')) return 'recruitment_services';
  if (r.includes('software solution') || r.includes('custom software') || r.includes('software engineering')) return 'software_solutions';
  if (r.includes('ats + crm') || r.includes('ats and crm') || (r.includes('ats') && r.includes('crm'))) return 'ats_crm';
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
  "disruptive"
];

// Anti-repetition dynamic subject lines (short, lowercase/conversational, highly relevant)
const INITIAL_SUBJECT_TEMPLATES: Record<OutreachIntent, string[]> = {
  pain_screening_bottleneck: [
    '{company} shortlist speed',
    'hours spent reviewing candidate cvs',
    'cv screening on your open mandates',
    'unqualified cv volume at {company}',
    'manual resume review bottleneck'
  ],
  time_saving: [
    'saving 8-10 hours on cv screening',
    '{company} candidate turnaround',
    'cutting screening time on open roles',
    'quick question about {company} screening hours',
    'faster shortlists for {company}'
  ],
  high_volume: [
    'handling high-volume cv intake at {company}',
    'auto-ranking candidate pools for {company}',
    'screening large applicant batches',
    'matching candidate pools to new jds',
    '{company} applicant volume'
  ],
  recruiter_productivity: [
    'consultant desk capacity at {company}',
    'accelerating submittal velocity for {company}',
    'consistent candidate scoring at {company}',
    '{company} recruiter submittal ratio',
    'candidate placement velocity'
  ],
  soft_cta_curiosity: [
    'quick question about {company} cv review',
    'cv screening workflow at {company}',
    '{company} candidate shortlisting',
    'idea for {company} recruitment team',
    'automated matching for {company}'
  ],
  general_ats_intelligence: [
    '{company} candidate matching',
    'recruitment screening intelligence',
    'faster shortlist turnaround for {company}',
    '{company} recruiter workflow',
    'ai candidate evaluation'
  ],
  vcs: [
    '{company} code review & VCS workflow',
    'streamlining version control at {company}',
    '{company} repository governance & dev velocity',
    'quick question regarding {company} engineering workflow',
    'VCS & deployment speed for {company}'
  ],
  recruitment_services: [
    'talent acquisition & recruitment for {company}',
    'hiring pipeline for {company}',
    'sourcing top candidates for {company}',
    'quick note regarding {company} open roles',
    'dedicated recruitment support for {company}'
  ],
  software_solutions: [
    'custom software solutions for {company}',
    'engineering capacity & software delivery at {company}',
    'accelerating {company} software roadmap',
    'modernizing applications for {company}',
    'scalable software development for {company}'
  ],
  ats_crm: [
    'unified ATS + CRM for {company}',
    'streamlining candidate & client pipeline at {company}',
    'eliminating siloed ATS & CRM tools at {company}',
    'all-in-one ATS + CRM app for {company}',
    '{company} recruitment & client workflow'
  ],
  hrms_crm: [
    'integrated HRMS + CRM for {company}',
    'connecting internal HR and external CRM at {company}',
    'all-in-one HRMS + CRM platform for {company}',
    '{company} employee & client management workflow',
    'streamlining HR operations & CRM for {company}'
  ]
};

// Conversational, personalized openings (1-2 sentences establishing relevance)
const OPENINGS: Record<OutreachIntent, string[]> = {
  pain_screening_bottleneck: [
    'Noticed {company} is actively managing high-priority recruitment mandates right now.',
    'Saw {company}’s recent hiring activity and open requisitions across competitive roles.',
    'Tracking {company}’s recent placements—managing multiple open mandates usually creates an intense screening bottleneck.',
    'Given {company}’s current recruitment volume, consultants are likely fielding dozens of applicants per role.'
  ],
  time_saving: [
    'With multiple active client mandates on {company}’s board, your recruiters are likely reviewing hundreds of resumes every single week.',
    'Saw {company} is expanding its recruitment activity across demanding roles this quarter.',
    'Noticed the pace of new job openings {company} is currently delivering against.',
    'Reaching out because several staffing and recruitment leaders we work with were losing half their mornings just reviewing CVs.'
  ],
  high_volume: [
    'Curious how your recruitment team at {company} handles applicant surges on competitive requisitions.',
    'When candidate volume spikes across open mandates, talent databases at {company} often end up underutilized because re-screening past CVs is so manual.',
    'Saw {company} is managing requisitions that typically attract high applicant numbers.',
    'With {company} handling sizable applicant volume, manually sorting top matches from mismatched resumes becomes a major time drain.'
  ],
  recruiter_productivity: [
    'In fast-moving recruitment, submitting the first vetted shortlist within 24 hours often determines who wins the placement.',
    'Reaching out to see how {company} is optimizing consultant desk capacity as your requisition volume grows.',
    'Tracking {company}’s delivery footprint—maintaining consistent candidate evaluation across different recruiters is always a tough balancing act.',
    'When recruiter desks get overwhelmed with resume reviews, consultant time gets pulled away from candidate engagement and business development.'
  ],
  soft_cta_curiosity: [
    'Saw {company} is actively delivering across multiple demanding client requisitions right now.',
    'Quick observation regarding {company}’s recruitment pipeline and active job openings.',
    'Noticed {company}’s recruitment activity and wanted to ask a quick operational question regarding your screening workflow.',
    'Following {company}’s recent growth and delivery across active talent searches.'
  ],
  general_ats_intelligence: [
    'Noticed {company}’s active talent acquisition activity and delivery across client requisitions.',
    'Reaching out regarding how modern recruitment teams at {company} streamline their first-level candidate evaluation.'
  ],
  vcs: [
    'Noticed {company}’s engineering team is shipping rapidly and scaling active codebases.',
    'Tracking {company}’s tech footprint—managing multi-branch version control and code review cycles often slows release speed.',
    'Saw the pace of technical releases at {company} and wanted to reach out regarding your development workflow.',
    'Reaching out to see how {company} currently optimizes its version control and engineering pipelines.'
  ],
  recruitment_services: [
    'Noticed {company} is actively scaling and searching for high-impact talent across critical roles.',
    'Saw {company}’s open mandates—sourcing specialized, pre-vetted professionals quickly is often a huge bottleneck.',
    'Tracking {company}’s hiring goals this quarter and wanted to share how we help fill specialized roles.',
    'Reaching out regarding {company}’s talent acquisition and specialist recruitment pipeline.'
  ],
  software_solutions: [
    'Following {company}’s recent tech initiatives and product expansion across your core systems.',
    'Noticed {company} is tackling ambitious product goals—scaling software engineering capacity is always a key priority.',
    'Reaching out regarding {company}’s software architecture and application delivery roadmap.',
    'Saw {company}’s ongoing digital development and wanted to share how we accelerate custom software delivery.'
  ],
  ats_crm: [
    'Noticed {company} manages both candidate acquisition and client relationships across active recruitment pipelines.',
    'Managing separate tools for applicant tracking and client CRM often leads to duplicate data entry and missed follow-ups at {company}.',
    'Reaching out to see how {company} currently bridges the gap between candidate sourcing and client account management.',
    'Tracking {company}’s business operations—unifying ATS candidate flow with CRM client deals saves hours of administrative drag.'
  ],
  hrms_crm: [
    'Tracking {company}’s organizational growth—coordinating internal HR operations alongside customer relationship management often requires juggling too many systems.',
    'Saw {company} is expanding operations, where having disconnected HRMS and CRM tools creates administrative overhead.',
    'Reaching out regarding how {company} centralizes employee management and customer operations.',
    'Notice how rapidly {company} is expanding—unifying human resources and client CRM in one platform eliminates duplicate software spend.'
  ]
};

// Value propositions focused strictly on BUSINESS OUTCOMES (Time saved, Desk capacity, Faster submittals)
const VALUE_PROPOSITIONS: Record<OutreachIntent, string[]> = {
  pain_screening_bottleneck: [
    'We built an AI recruitment intelligence layer that auto-matches CVs against your exact JD requirements, flags missing mandatory skills, and surfaces the top 5% of candidates before your recruiters open a file.',
    'Instead of recruiters losing 2–3 hours daily manually cross-referencing CVs against complex JDs, our platform auto-ranks candidates and spots missing requirements in seconds.',
    'Our platform eliminates that manual first pass by instantly scoring applicant experience and mandatory requirements against your JD so recruiters only review genuine fits.'
  ],
  time_saving: [
    'Upload your JD and CV batch, and our platform auto-ranks candidates with transparent match scores, saving recruiters 8–10 hours each week on manual screening.',
    'Our screening engine cuts first-level review time from hours to seconds by automatically evaluating candidate skills and missing criteria against your JD.',
    'Our platform automates first-pass screening so your recruiters can take candidate shortlists to hiring managers in hours instead of days.'
  ],
  high_volume: [
    'Our platform parses and evaluates large batches of CVs against your JD in seconds, auto-ranking candidates and reactivating existing talent pools instantly.',
    'Rather than letting candidate databases sit idle, our matching engine re-scores entire applicant pools against new client JDs automatically.',
    'Our engine handles high-volume applicant intake effortlessly, generating ATS match scores and identifying qualified profiles in minutes.'
  ],
  recruiter_productivity: [
    'By standardizing candidate evaluation against your JD criteria, recruiters maintain consistent submittal quality while increasing their active desk capacity.',
    'Our platform helps recruitment teams cut shortlist turnaround time by 70%, giving consultants more time for candidate relationships and closing placements.',
    'Our intelligence layer gives recruiters an immediate breakdown of matching vs. missing skills, helping your team submit vetted shortlists ahead of competing agencies.'
  ],
  soft_cta_curiosity: [
    'We built an automated matching layer that scores incoming CVs against your exact JD requirements and surfaces the top candidates instantly.',
    'Our platform auto-evaluates candidate skills against JDs in seconds so recruiters never waste hours rejecting unqualified applicants manually.'
  ],
  general_ats_intelligence: [
    'Our platform auto-matches candidate CVs against JDs, flags missing requirements, and surfaces the strongest applicants in seconds.'
  ],
  vcs: [
    'We help engineering teams optimize their VCS pipelines, automate code review checks, and eliminate merge bottlenecks so developers ship features 40% faster.',
    'Our version control workflow solutions integrate directly into your repositories to enforce code quality, automate pull request triage, and accelerate sprint releases.',
    'We eliminate engineering deployment drag by streamlining branch management, automated linting, and VCS pipeline coordination across your developer teams.'
  ],
  recruitment_services: [
    'Our recruitment services deliver rigorously vetted, role-ready candidate shortlists within 48 to 72 hours, saving your team weeks of manual talent search.',
    'We manage full-cycle candidate sourcing, technical screening, and initial interviewing so your hiring managers only spend time talking to top-tier finalists.',
    'Our specialized recruitment practice connects {company} with top-percentile passive candidates across engineering, product, and leadership roles.'
  ],
  software_solutions: [
    'We build robust, high-performance software solutions—from modern web and mobile apps to resilient cloud backends—tailored to {company}’s exact business needs.',
    'Our engineering teams partner with businesses to architect, build, and scale custom software systems with enterprise-grade quality and rapid sprint turnarounds.',
    'We help teams bridge technical bandwidth gaps, modernizing legacy systems and delivering production-grade applications on time and within budget.'
  ],
  ats_crm: [
    'Our ATS + CRM app unifies candidate pipelines and client deal tracking into a single pane of glass, eliminating double-entry and keeping recruiters and BD consultants in sync.',
    'With our all-in-one ATS + CRM platform, your team can track applicants from sourcing to placement while managing client contracts and outreach seamlessly.',
    'Our integrated platform automates resume parsing, candidate stages, and client communication in one workspace, cutting operational overhead in half.'
  ],
  hrms_crm: [
    'Our unified HRMS + CRM platform connects end-to-end human resource operations (onboarding, attendance, payroll) with full CRM capabilities in one unified dashboard.',
    'We eliminate the friction of fragmented software by integrating employee lifecycle management directly with client and project tracking.',
    'Our platform gives leadership a 360-degree view of team productivity, internal workforce operations, and customer pipeline management without paying for multiple SaaS tools.'
  ]
};

// Low-friction, interest-based CTAs (Easy yes/no, conversation starters, 90-sec walkthroughs)
const LOW_FRICTION_CTAS: string[] = [
  'Open to seeing a 90-second example of how it works on a live JD?',
  'Would you be open to a quick 2-minute walkthrough video?',
  'Is candidate screening taking up more recruiter time than you’d like this quarter?',
  'Would it be useful if I sent over a short 1-page breakdown of how it works?',
  'Should I send over a quick example showing how other agencies use it?',
  'Is shortening your team’s CV screening time something on your radar this month?',
  'Open to checking out a brief 2-minute workflow overview?'
];

// FOLLOW-UP SYSTEM (5 Stages: Day 0 initial -> Day 2 reframe -> Day 4 proof -> Day 6 qualifying -> Day 8 breakup)
const FOLLOW_UP_1_SUBJECTS = [
  're: {company} shortlist speed',
  'quick follow-up: {company} screening hours',
  're: candidate turnaround at {company}',
  'desk capacity at {company}'
];

const FOLLOW_UP_1_HOOKS = [
  'Following up on my note from earlier this week.',
  'Sharing a quick follow-up to my earlier note regarding {company}’s recruitment workflow.',
  'Circling back briefly on the note I sent a couple of days ago.'
];

const FOLLOW_UP_1_VALUES: Record<OutreachIntent, string[]> = {
  pain_screening_bottleneck: [
    'One thing we regularly hear from recruitment leaders is that 60% of recruiter screening time is spent reviewing candidates who were never qualified to begin with.',
    'Recruiters often lose their most productive morning hours simply rejecting mismatched CVs instead of talking to placement-ready talent.'
  ],
  time_saving: [
    'If your consultants could get back 8–10 hours of manual screening time per week, would that noticeably impact {company}’s placement targets?',
    'A quick metric: teams using our screening layer cut first-round review time by over 70% within their first two weeks.'
  ],
  high_volume: [
    'Most recruitment teams tell us their biggest challenge with large applicant volumes is candidate drop-off caused by slow shortlist review cycles.',
    'Auto-ranking applicant batches allows consultants to reach out to the top 5% of candidates before competitors even open the resume.'
  ],
  recruiter_productivity: [
    'When consultants spend less time reading through resumes and more time speaking to top candidates, monthly placement velocity increases dramatically.',
    'Standardizing match scores across JDs gives account managers total confidence in the shortlists submitted to clients.'
  ],
  soft_cta_curiosity: [
    'We put together a 90-second clip showing how a recruitment team screened 120 CVs against a senior spec in under 3 minutes.',
    'Curious if your team is still manually reviewing resumes or if you already have an automated layer handling the initial filter.'
  ],
  general_ats_intelligence: [
    'If your consultants could cut screening down from hours to minutes per role, would that help hit your targets this quarter?'
  ],
  vcs: [
    'One pattern we regularly see across engineering teams is that up to 30% of developer sprint time is lost to merge conflicts and manual code review bottlenecks.',
    'Optimizing branch governance and pull request velocity helps development teams ship reliable code with significantly less friction.'
  ],
  recruitment_services: [
    'When high-priority positions stay vacant for weeks, internal engineering and business roadmaps slip—our dedicated recruitment service eliminates that lag.',
    'Directly sourcing pre-vetted specialists ensures your hiring leads only interview candidates ready to accept offers.'
  ],
  software_solutions: [
    'Many companies face aggressive delivery schedules where dedicated software solutions and specialized engineering bandwidth make all the difference.',
    'Our agile engineering model provides turnkey software development without the overhead and ramp-up delay of traditional agency contracts.'
  ],
  ats_crm: [
    'When candidate data lives in one tool and client deals live in another, consultants waste hours duplicating data and losing candidate-client context.',
    'Unifying candidate sourcing with client relationship management ensures that every placement conversation is backed by live account history.'
  ],
  hrms_crm: [
    'Managing employee records, leave, and payroll in one silo while tracking customer projects in another creates administrative fragmentation.',
    'Connecting internal HRMS workflows with client CRM gives operations teams full transparency over workforce resource allocation and client billing.'
  ]
};

const FOLLOW_UP_2_SUBJECTS = [
  'micro case study for {company}',
  'quick example: 70% faster screening',
  'how another agency cut screening time',
  'shortlist turnaround insight'
];

const FOLLOW_UP_2_PROOFS: Record<OutreachIntent, string[]> = {
  pain_screening_bottleneck: [
    'A 20-person staffing firm recently tested our matching platform on their high-volume technical roles. By auto-flagging missing requirements and pre-scoring CVs, they reduced shortlist turnaround from 3 days to under 4 hours.',
    'One of our agency partners eliminated an 80-CV backlog in 15 minutes by letting our engine rank the top candidates against their client’s mandatory requirements.'
  ],
  time_saving: [
    'A recruitment consultancy recently tested our platform on 15 live requisitions. Their recruiters gained back an average of 9 hours per week, boosting client submittal speed by 65%.',
    'One of our clients cut their time-to-shortlist by 75% in the first month simply because recruiters engaged pre-vetted matches immediately.'
  ],
  high_volume: [
    'A technical staffing agency used our platform to batch-screen 400 applicants across three enterprise accounts, shortlisting the top 15 verified candidates in less than 30 minutes.',
    'By auto-matching their dormant candidate database against fresh JDs, an agency partner generated 4 placements from existing profiles without running new job ads.'
  ],
  recruiter_productivity: [
    'Within 60 days of adopting our automated screening layer, an agency client increased their monthly submittal-to-interview ratio by 28% due to more consistent candidate evaluation.',
    'Consultant billing capacity rose significantly once manual CV parsing was removed from their daily routine.'
  ],
  soft_cta_curiosity: [
    'A 25-person agency cut their average candidate submittal time from 48 hours to 4 hours using our 1-click JD matching engine.',
    'Happy to send over the 1-page summary of how they structured it if you’d find that interesting.'
  ],
  general_ats_intelligence: [
    'A staffing partner recently reduced screening cycles from 3 days to 4 hours by auto-ranking candidate skills against client specs.'
  ],
  vcs: [
    'An engineering organization recently streamlined their repository pipelines with our VCS workflows, reducing pull request review cycles from 48 hours to under 6 hours.',
    'One of our tech partners eliminated release deployment blockers by automating branch checks and repository workflows directly in their VCS.'
  ],
  recruitment_services: [
    'A fast-growing technology company filled 4 hard-to-hire senior technical roles within 18 days through our dedicated candidate sourcing service.',
    'Our recruitment team helped an enterprise partner cut their average time-to-hire from 6 weeks to 14 days with zero sacrifice in talent quality.'
  ],
  software_solutions: [
    'We partnered with a client to design and launch an enterprise web application in just 8 weeks, helping them beat their market launch deadline by a month.',
    'Our team modernized a legacy architecture for a SaaS platform, reducing infrastructure latency by 45% and eliminating system crashes.'
  ],
  ats_crm: [
    'A 30-person agency transitioned to our unified ATS + CRM app, saving 6 hours per consultant weekly and increasing submittal-to-placement rates by 22%.',
    'By consolidating separate applicant tracking and sales CRM systems, our partner reduced SaaS tool spend by 40% while streamlining placement delivery.'
  ],
  hrms_crm: [
    'A mid-sized services company consolidated their HR administration and customer tracking onto our HRMS + CRM platform, cutting administrative time by 50%.',
    'Our integrated platform enabled a 60-person organization to automate employee onboarding and client project staffing within a single portal.'
  ]
};

const FOLLOW_UP_3_SUBJECTS = [
  'quick qualifying question for {company}',
  '{company} screening priorities',
  'simple question regarding {company}',
  'quick check on recruiter capacity'
];

const FOLLOW_UP_3_QUESTIONS = [
  'Is shortening your team’s CV screening time and candidate turnaround even a priority for {company} right now, or is your current workflow already operating as fast as you’d like? Either answer helps—just wanted to see if exploring this makes sense for your consultants this quarter.',
  'Are resume screening bottlenecks something your team is actively looking to improve this quarter, or is manual review working fine for your current volume? Happy to step back if the timing isn’t right.',
  'Quick qualifying question: is recruiter screening capacity a bottleneck at {company} today, or are internal workflows already keeping up with all your requisitions?'
];

const FOLLOW_UP_4_SUBJECTS = [
  'permission to close file: {company}',
  'final note regarding {company}',
  'closing the loop for {company}',
  'respecting your time: {company}'
];

const FOLLOW_UP_4_BREAKUPS = [
  'Haven’t heard back, so I assume automated CV screening and shortlist acceleration isn’t a priority for {company} right now. I won’t follow up again. If candidate screening ever becomes a bottleneck on larger mandates down the road, feel free to reach back out anytime. Wishing you and the team continued success.',
  'I don’t want to crowd your inbox if the timing isn’t right for {company}. I’ll assume your team is currently set and step back for now. Should resume screening or recruiter desk capacity become an issue in the future, our door is always open. All the best.',
  'Closing the loop on my end. If {company} ever looks to eliminate manual CV screening or speed up client shortlists down the line, feel free to keep my details handy. Thank you for your time.'
];

function pickRandom<T>(items: T[], exclude?: T[]): T {
  const filtered = exclude ? items.filter(i => !exclude.includes(i)) : items;
  const pool = filtered.length > 0 ? filtered : items;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Strict quality scoring according to the framework (1-10 on 10 dimensions)
export interface QualityAssessment {
  valid: boolean;
  notes: string[];
  score: {
    personalization: number;
    relevance: number;
    clarity: number;
    painStrength: number;
    valueProp: number;
    credibility: number;
    ctaStrength: number;
    naturalness: number;
    spamRisk: number; // lower is better (0-10)
    replyPotential: number;
  };
  overallConversionScore: number;
}

export function validateEmailQuality(
  subject: string,
  body: string,
  companyName: string,
  reason: string,
  previousEmails: string[] = []
): QualityAssessment {
  const notes: string[] = [];
  const lowerBody = body.toLowerCase();
  const lowerSubject = subject.toLowerCase();

  let personalization = 9;
  let relevance = 9;
  let clarity = 10;
  let painStrength = 9;
  let valueProp = 9;
  let credibility = 8.5;
  let ctaStrength = 9;
  let naturalness = 9.5;
  let spamRisk = 0.5;
  let replyPotential = 9;

  // 1. Verify company mention
  if (!lowerBody.includes(companyName.toLowerCase()) && !lowerSubject.includes(companyName.toLowerCase())) {
    notes.push('Warning: Company name not explicitly mentioned in subject or body.');
    personalization -= 2;
  }

  // 2. Check for banned clichés
  for (const phrase of BANNED_CLICHES) {
    if (lowerBody.includes(phrase)) {
      notes.push(`Spam/cliché phrase detected: "${phrase}".`);
      spamRisk += 3;
      naturalness -= 2;
      replyPotential -= 2;
    }
  }

  // 3. Exclamation & all-caps checks
  if (body.includes('!') || subject.includes('!')) {
    const exclamations = (body.match(/!/g) || []).length;
    if (exclamations > 1) {
      notes.push('Excessive exclamation marks detected.');
      spamRisk += 2;
    }
  }
  if (subject === subject.toUpperCase() && subject.length > 10) {
    notes.push('All-caps subject detected.');
    spamRisk += 4;
  }

  // 4. Repetition check against previous touches
  for (const prev of previousEmails) {
    if (prev && prev.trim().length > 0) {
      if (body.trim() === prev.trim() || subject.trim().toLowerCase() === prev.trim().toLowerCase()) {
        notes.push('Identical or overly repetitive copy detected from previous touch.');
        replyPotential -= 3;
      }
    }
  }

  // 5. Length check: Strict 60-120 words for cold initial outreach
  const count = wordCount(body);
  if (count < 40) {
    notes.push('Email is too brief to convey value.');
    valueProp -= 2;
  } else if (count > 130) {
    notes.push(`Email is ${count} words; cold outreach is most effective between 60-120 words.`);
    clarity -= 1.5;
    replyPotential -= 1;
  }

  const valid = notes.filter(n => n.includes('Spam') || n.includes('All-caps') || n.includes('Identical')).length === 0;

  const overallConversionScore = Math.round(
    ((personalization + relevance + clarity + painStrength + valueProp + credibility + ctaStrength + naturalness + (10 - spamRisk) + replyPotential) / 10) * 10
  ) / 10;

  return {
    valid,
    notes,
    score: {
      personalization,
      relevance,
      clarity,
      painStrength,
      valueProp,
      credibility,
      ctaStrength,
      naturalness,
      spamRisk,
      replyPotential
    },
    overallConversionScore
  };
}

// High-performing local synthesis engine based on the 5 angles
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
  const cleanCompany = companyName.trim() || 'your team';
  const salutation = recipientName && recipientName.trim() ? `Hi ${recipientName.trim()},` : `Hi ${cleanCompany} team,`;

  let subject = '';
  let bodyContent = '';
  let emailType = '';

  if (followUpNumber === 0) {
    // STAGE 0: Initial Outreach (Target: 65-95 words, high relevance, outcome-based, low-friction CTA)
    emailType = `initial_${intent}`;
    const subjectTemplates = INITIAL_SUBJECT_TEMPLATES[intent] || INITIAL_SUBJECT_TEMPLATES.time_saving;
    const pastSubjects = previousSubject ? [previousSubject] : [];
    const template = pickRandom(subjectTemplates, pastSubjects);
    subject = template.replace('{company}', cleanCompany);

    const opening = pickRandom(OPENINGS[intent] || OPENINGS.time_saving).replace(/{company}/g, cleanCompany);
    const valueProp = pickRandom(VALUE_PROPOSITIONS[intent] || VALUE_PROPOSITIONS.time_saving).replace(/{company}/g, cleanCompany);
    const cta = pickRandom(LOW_FRICTION_CTAS);

    const paragraphs = [
      salutation,
      opening,
      valueProp,
      cta
    ];

    bodyContent = paragraphs.join('\n\n');
  } else if (followUpNumber === 1) {
    // STAGE 1 (Day 2): Problem Re-frame / Desk Reality (50-75 words)
    emailType = 'follow_up_1_problem_reframe';
    const subjTemplate = pickRandom(FOLLOW_UP_1_SUBJECTS);
    subject = subjTemplate.replace('{company}', cleanCompany);

    const hook = pickRandom(FOLLOW_UP_1_HOOKS);
    const value = pickRandom(FOLLOW_UP_1_VALUES[intent] || FOLLOW_UP_1_VALUES.time_saving).replace(/{company}/g, cleanCompany);
    const cta = pickRandom([
      'Open to a quick exchange?',
      'Would you be open to a 2-minute overview?',
      'Does your team have 5 minutes to compare notes later this week?'
    ]);

    bodyContent = [
      salutation,
      hook,
      value,
      cta
    ].join('\n\n');
  } else if (followUpNumber === 2) {
    // STAGE 2 (Day 4): Micro Case Insight / Proof Point (55-80 words)
    emailType = 'follow_up_2_micro_proof';
    const subjTemplate = pickRandom(FOLLOW_UP_2_SUBJECTS);
    subject = subjTemplate.replace('{company}', cleanCompany);

    const proof = pickRandom(FOLLOW_UP_2_PROOFS[intent] || FOLLOW_UP_2_PROOFS.time_saving).replace(/{company}/g, cleanCompany);
    const cta = pickRandom([
      'Would you be interested in seeing the 1-page summary of how they set it up?',
      'Open to seeing how this maps against your current applicant workflow?',
      'Would a quick 90-second example be useful?'
    ]);

    bodyContent = [
      salutation,
      'Thought this might be relevant to your delivery workflow:',
      proof,
      cta
    ].join('\n\n');
  } else if (followUpNumber === 3) {
    // STAGE 3 (Day 6): Simple Binary Qualifying Question (35-55 words)
    emailType = 'follow_up_3_qualifying_question';
    const subjTemplate = pickRandom(FOLLOW_UP_3_SUBJECTS);
    subject = subjTemplate.replace('{company}', cleanCompany);

    const question = pickRandom(FOLLOW_UP_3_QUESTIONS).replace(/{company}/g, cleanCompany);

    bodyContent = [
      salutation,
      question
    ].join('\n\n');
  } else {
    // STAGE 4 (Day 8+): Permission-Based Breakup Closing Loop (35-50 words)
    emailType = 'follow_up_4_breakup';
    const subjTemplate = pickRandom(FOLLOW_UP_4_SUBJECTS);
    subject = subjTemplate.replace('{company}', cleanCompany);

    const breakup = pickRandom(FOLLOW_UP_4_BREAKUPS).replace(/{company}/g, cleanCompany);

    bodyContent = [
      salutation,
      breakup
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

// Master OpenAI generator implementing the full B2B outbound copywriting framework
async function generateWithOpenAI(
  payload: EmailGenerationPayload,
  apiKey: string
): Promise<GeneratedEmailResult> {
  const {
    companyName,
    reason,
    mailTopic,
    recipientName,
    previousSubject,
    previousEmails = [],
    followUpNumber = 0,
    tone = 'Professional'
  } = payload;

  const intent = classifyIntent(reason, mailTopic);
  const stageDescription =
    followUpNumber === 0
      ? 'Initial Outreach Email (STRICTLY 65-100 words. Personalized hook referencing their company/hiring reality, 1-sentence outcome-focused value prop on eliminating bottlenecks and saving time/cost, low-friction interest-based CTA asking for a 90-second example or 2-minute video. Zero fluff, zero spam clichés).'
      : followUpNumber === 1
      ? 'Follow-Up 1 (STRICTLY 50-75 words. Problem re-frame focusing on operational reality and common friction points. Do NOT say "just following up". End with an easy conversational question).'
      : followUpNumber === 2
      ? 'Follow-Up 2 (STRICTLY 55-80 words. Micro case study or proof point: a client achieved measurable turnaround or efficiency improvement. Offer 1-page summary).'
      : followUpNumber === 3
      ? 'Follow-Up 3 (STRICTLY 35-55 words. Simple binary qualifying question: is this area a priority to improve right now, or is current workflow keeping pace?).'
      : 'Follow-Up 4 (STRICTLY 35-50 words. Permission-based breakup closing loop: assume timing is not right, stepping back, zero pressure, wish them success).';

  const systemPrompt = `You are an elite B2B cold-email copywriter and conversion strategist for a modern solutions and software provider.

OUR CORE PRODUCT OFFERINGS & VALUE ANGLES KNOWLEDGE BASE:
When generating outreach emails and follow-ups, dynamically leverage the most relevant angle(s) according to the selected Mail Topic:

1. VCS (Version Control Systems & Engineering Workflows):
   - Focus: Streamlining Git repository governance, automated CI/CD branch checks, pull request velocity, eliminating merge bottlenecks, accelerating sprint releases.

2. recruitment services (Talent Acquisition & Staffing):
   - Focus: Delivering pre-vetted, high-impact candidate shortlists within 48-72 hours, specialized technical/executive searches, cutting time-to-hire, eliminating recruiter bandwidth bottlenecks.

3. software solutions (Custom Software & Product Engineering):
   - Focus: Custom web/mobile/cloud engineering, enterprise digital transformation, scalable API backends, modernizing legacy systems, agile sprint delivery.

4. ATS + CRM app (Unified Applicant Tracking & Client CRM):
   - Focus: Single-pane-of-glass platform connecting candidate talent pools with client business deals, eliminating double-entry across disjointed tools, syncing recruiters and account managers.

5. HRMS + CRm (Integrated HR Management & CRM Platform):
   - Focus: Unifying employee lifecycle management (onboarding, attendance, payroll) with client project and relationship management, eliminating multi-SaaS software sprawl and administrative overhead.

6. Screening Bottleneck & Time Saving:
   - Focus: Auto-matches CVs against exact JD criteria, flags missing mandatory skills, saves recruiters 8-10 hours weekly.

COPYWRITING RULES:
1. STRICT WORD COUNT: First email must be between 65 and 100 words. Follow-ups between 35 and 75 words.
2. NEVER write generic emails like "Hi, we have a platform. Would you like a demo?".
3. Answer: Why this person? Why this company? Why this problem? Why our solution?
4. SELL OUTCOMES, NOT FEATURES: Talk about capacity, speed, cost efficiency, and developer/recruiter output.
5. LOW-FRICTION CTA: Always use interest-based CTAs like "Open to seeing a 90-second example?", "Would a quick 2-minute video be relevant?". NEVER demand a 30-minute demo.
6. BANNED PHRASES: NEVER use "hope you're doing well", "hope this email finds you well", "i am writing to introduce", "we would love to connect", "touching base", "just checking in", "bump this", "revolutionary", "urgent".
7. SUBJECT LINES: Short, natural, lower-case or conversational.
8. Do NOT include placeholder tokens like [Your Name] or signature blocks.

OUTPUT FORMAT:
Return strictly valid JSON only with keys:
{
  "subject": "natural lower-case or conversational subject",
  "body": "email body text without signature",
  "emailType": "angle_stage",
  "tone": "${tone}"
}`;

  const userPrompt = `Generate a high-converting cold email:
Company: ${companyName}
Recipient Name: ${recipientName || 'Not specified'}
Mail Topic / Category: ${mailTopic || 'General'}
Outreach Focus / Pain Point: "${reason}"
Angle Category: ${intent}
Stage: ${stageDescription}
Desired Tone: ${tone}
Previous Subject (Do NOT repeat): "${previousSubject || 'None'}"
Previous Emails (Do NOT duplicate copy): ${JSON.stringify(previousEmails)}`;

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
      temperature: 0.75,
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
    emailType: parsed.emailType || `ats_${intent}`,
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
      if (openAiResult.qualityPassed) {
        return openAiResult;
      }
    } catch (err) {
      console.warn('OpenAI generation failed or errored, falling back to dynamic local engine:', err);
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
