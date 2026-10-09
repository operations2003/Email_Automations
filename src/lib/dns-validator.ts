import { promises as dns } from 'dns';

export interface RecordCheckResult {
  status: 'pass' | 'warning' | 'fail' | 'missing';
  found: boolean;
  rawRecord?: string;
  details: string;
  recommendations: string[];
}

export interface DnsVerificationReport {
  domain: string;
  checkedAt: string;
  overallScore: number; // 0 - 100
  overallStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  spf: RecordCheckResult;
  dkim: {
    status: 'pass' | 'warning' | 'fail' | 'missing';
    selectorsChecked: Array<{
      selector: string;
      found: boolean;
      rawRecord?: string;
      provider?: string;
    }>;
    details: string;
    recommendations: string[];
  };
  dmarc: RecordCheckResult & {
    policy?: 'none' | 'quarantine' | 'reject';
    ruaConfigured?: boolean;
  };
  mx: RecordCheckResult & {
    servers?: string[];
  };
  deliverabilitySummary: string;
}

/**
 * Extracts the base domain from an email or domain string
 */
export function extractDomain(input: string): string {
  if (!input) return '';
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed.split('@')[1];
  }
  return trimmed.replace(/^https?:\/\//, '').split('/')[0];
}

/**
 * Validates SPF, DKIM, DMARC, and MX records for a domain
 */
export async function verifyDomainDns(
  rawDomain: string,
  preferredProvider: 'smtp' | 'resend' | 'simulated' = 'smtp'
): Promise<DnsVerificationReport> {
  const domain = extractDomain(rawDomain);
  const now = new Date().toISOString();

  if (!domain) {
    throw new Error('A valid domain name or email address is required for DNS verification.');
  }

  // 1. Check SPF
  let spfResult: RecordCheckResult = {
    status: 'missing',
    found: false,
    details: 'No SPF record found for this domain.',
    recommendations: [
      `Add a TXT record for "${domain}" with value "v=spf1 include:_spf.google.com ~all" (for Google Workspace) or your provider's SPF.`
    ]
  };

  try {
    const txtRecords = await dns.resolveTxt(domain);
    const spfRecords = txtRecords
      .map(chunks => chunks.join(''))
      .filter(record => record.trim().toLowerCase().startsWith('v=spf1'));

    if (spfRecords.length > 1) {
      spfResult = {
        status: 'fail',
        found: true,
        rawRecord: spfRecords.join(' | '),
        details: 'Multiple SPF records detected. RFC 7208 strictly forbids more than one SPF record per domain. This causes automatic authentication failure.',
        recommendations: [
          'Merge all SPF mechanisms into a single TXT record, e.g. "v=spf1 include:_spf.google.com ~all"'
        ]
      };
    } else if (spfRecords.length === 1) {
      const spf = spfRecords[0];
      const hasGoogle = spf.includes('_spf.google.com');
      const hasResend = spf.includes('resend') || spf.includes('amazonses');
      const hasAll = spf.includes('~all') || spf.includes('-all') || spf.includes('?all');

      const recs: string[] = [];
      let status: 'pass' | 'warning' | 'fail' = 'pass';
      let details = `Valid SPF record found: "${spf}"`;

      if (preferredProvider === 'smtp' && !hasGoogle) {
        status = 'warning';
        recs.push('If sending via Google Workspace / Gmail SMTP, include "_spf.google.com" in your SPF record.');
      }

      if (!hasAll) {
        status = 'warning';
        recs.push('Ensure your SPF record ends with "~all" (SoftFail) or "-all" (HardFail).');
      }

      if (spf.includes('+all')) {
        status = 'fail';
        details = 'Insecure SPF record: "+all" authorizes any IP on the internet to send on your behalf.';
        recs.push('Change "+all" to "~all" immediately to prevent unauthorized domain spoofing.');
      }

      spfResult = {
        status,
        found: true,
        rawRecord: spf,
        details,
        recommendations: recs
      };
    }
  } catch (err: any) {
    if (err.code !== 'ENOTFOUND' && err.code !== 'ENODATA') {
      spfResult.details = `DNS query error: ${err.message}`;
    }
  }

  // 2. Check DKIM Selectors
  const selectorsToTest = [
    { selector: 'google', domainPrefix: `google._domainkey.${domain}`, provider: 'Google Workspace' },
    { selector: 'resend', domainPrefix: `resend._domainkey.${domain}`, provider: 'Resend' },
    { selector: 'default', domainPrefix: `default._domainkey.${domain}`, provider: 'Standard Default' },
    { selector: 'k1', domainPrefix: `k1._domainkey.${domain}`, provider: 'Amazon SES / Alternative' }
  ];

  const dkimResults: Array<{
    selector: string;
    found: boolean;
    rawRecord?: string;
    provider?: string;
  }> = [];

  for (const item of selectorsToTest) {
    try {
      const records = await dns.resolveTxt(item.domainPrefix);
      const val = records.map(c => c.join('')).join('');
      if (val && (val.includes('k=rsa') || val.includes('p=') || val.includes('v=DKIM1'))) {
        dkimResults.push({
          selector: item.selector,
          found: true,
          rawRecord: val,
          provider: item.provider
        });
      }
    } catch {
      // not found for this selector
      dkimResults.push({
        selector: item.selector,
        found: false,
        provider: item.provider
      });
    }
  }

  const foundDkim = dkimResults.filter(d => d.found);
  let dkimStatus: 'pass' | 'warning' | 'fail' | 'missing' = 'missing';
  let dkimDetails = 'No public DKIM keys found on standard selectors (google, resend, default).';
  const dkimRecs: string[] = [];

  if (foundDkim.length > 0) {
    dkimStatus = 'pass';
    const foundNames = foundDkim.map(d => `${d.provider} (${d.selector})`).join(', ');
    dkimDetails = `DKIM authentication key(s) verified for: ${foundNames}.`;
  } else {
    dkimRecs.push(
      `For Google Workspace: Generate and publish a DKIM key in Google Admin Console -> Apps -> Google Workspace -> Gmail -> Authenticate email.`
    );
    dkimRecs.push(
      `For Resend: Add and verify your domain at https://resend.com/domains to publish Resend DKIM records.`
    );
  }

  // 3. Check DMARC
  let dmarcResult: RecordCheckResult & { policy?: 'none' | 'quarantine' | 'reject'; ruaConfigured?: boolean } = {
    status: 'missing',
    found: false,
    details: `No DMARC record found at "_dmarc.${domain}". In 2024+, Gmail and Yahoo require DMARC for sender reputation.`,
    recommendations: [
      `Add a TXT record at "_dmarc.${domain}" with value "v=DMARC1; p=none; rua=mailto:postmaster@${domain}" to satisfy minimum requirements.`
    ]
  };

  try {
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
    const flatDmarc = dmarcRecords
      .map(chunks => chunks.join(''))
      .filter(record => record.trim().toLowerCase().startsWith('v=dmarc1'));

    if (flatDmarc.length > 0) {
      const rec = flatDmarc[0];
      const hasPolicyNone = /p\s*=\s*none/i.test(rec);
      const hasPolicyQuarantine = /p\s*=\s*quarantine/i.test(rec);
      const hasPolicyReject = /p\s*=\s*reject/i.test(rec);
      const policy = hasPolicyReject ? 'reject' : hasPolicyQuarantine ? 'quarantine' : 'none';
      const hasRua = /rua\s*=/i.test(rec);

      const dmarcRecs: string[] = [];
      let status: 'pass' | 'warning' = 'pass';

      if (policy === 'none') {
        dmarcRecs.push('Policy is currently "p=none" (monitoring mode). Once SPF and DKIM are fully aligned, graduate to "p=quarantine" or "p=reject" for best deliverability.');
      }
      if (!hasRua) {
        status = 'warning';
        dmarcRecs.push('Add an aggregate reporting email address (rua=mailto:reports@...) to receive DMARC diagnostic summaries.');
      }

      dmarcResult = {
        status,
        found: true,
        rawRecord: rec,
        policy,
        ruaConfigured: hasRua,
        details: `Valid DMARC record found with policy "${policy}".`,
        recommendations: dmarcRecs
      };
    }
  } catch (err: any) {
    if (err.code !== 'ENOTFOUND' && err.code !== 'ENODATA') {
      dmarcResult.details = `DNS query error: ${err.message}`;
    }
  }

  // 4. Check MX Records
  let mxResult: RecordCheckResult & { servers?: string[] } = {
    status: 'missing',
    found: false,
    details: 'No MX records found. Receiving mail and bounces may fail.',
    recommendations: ['Configure MX records with your mail host so return replies and bounces can be delivered.']
  };

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      const sorted = mxRecords.sort((a, b) => a.priority - b.priority).map(m => `${m.exchange} (prio ${m.priority})`);
      mxResult = {
        status: 'pass',
        found: true,
        servers: sorted,
        rawRecord: sorted.join(', '),
        details: `${mxRecords.length} MX record(s) resolved successfully.`,
        recommendations: []
      };
    }
  } catch (err: any) {
    if (err.code !== 'ENOTFOUND' && err.code !== 'ENODATA') {
      mxResult.details = `DNS query error: ${err.message}`;
    }
  }

  // 5. Calculate Overall Score
  let score = 0;
  if (spfResult.found && spfResult.status === 'pass') score += 30;
  else if (spfResult.found && spfResult.status === 'warning') score += 20;

  if (dkimStatus === 'pass') score += 35;

  if (dmarcResult.found && dmarcResult.status === 'pass') score += 25;
  else if (dmarcResult.found && dmarcResult.status === 'warning') score += 15;

  if (mxResult.found && mxResult.status === 'pass') score += 10;

  let overallStatus: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' = 'EXCELLENT';
  if (score < 40) overallStatus = 'CRITICAL';
  else if (score < 70) overallStatus = 'WARNING';
  else if (score < 90) overallStatus = 'GOOD';

  let deliverabilitySummary = '';
  if (score >= 90) {
    deliverabilitySummary = 'Domain authentication meets modern Google & Yahoo standards. Primary spam filters will verify your identity successfully.';
  } else if (score >= 70) {
    deliverabilitySummary = 'Domain authentication is partially configured. Some mail servers may flag messages as untrusted without complete DKIM or DMARC.';
  } else {
    deliverabilitySummary = 'Critical authentication gaps detected. Modern spam filters are highly likely to route emails directly to Spam or reject delivery.';
  }

  return {
    domain,
    checkedAt: now,
    overallScore: score,
    overallStatus,
    spf: spfResult,
    dkim: {
      status: dkimStatus,
      selectorsChecked: dkimResults,
      details: dkimDetails,
      recommendations: dkimRecs
    },
    dmarc: dmarcResult,
    mx: mxResult,
    deliverabilitySummary
  };
}
