import { promises as dns } from 'dns';

export function extractDomain(input: string): string {
  if (!input) return '';
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed.split('@')[1];
  }
  return trimmed.replace(/^https?:\/\//, '').split('/')[0];
}

export interface BlacklistCheckResult {
  listName: string;
  host: string;
  listed: boolean;
  response?: string;
  description: string;
}

export interface DomainReputationReport {
  domain: string;
  checkedAt: string;
  reputationStatus: 'CLEAN' | 'NEUTRAL' | 'FLAGGED';
  blacklistsChecked: BlacklistCheckResult[];
  ipChecks: BlacklistCheckResult[];
  resolvedIps: string[];
  riskFactors: string[];
  recommendations: string[];
}

const DOMAIN_BLACKCHALLENGES = [
  {
    name: 'Spamhaus DBL',
    zone: 'dbl.spamhaus.org',
    description: 'Premier domain blocklist monitored by major email providers including Google and Microsoft.'
  },
  {
    name: 'SURBL',
    zone: 'multi.surbl.org',
    description: 'Real-time blacklist of domains found in unsolicited bulk email.'
  },
  {
    name: 'URIBL',
    zone: 'multi.uribl.com',
    description: 'Blacklist of domains frequently identified in unsolicited marketing.'
  }
];

const IP_BLACKCHALLENGES = [
  {
    name: 'Spamhaus ZEN',
    zone: 'zen.spamhaus.org',
    description: 'Composite IP blocklist containing known spam senders and open relays.'
  },
  {
    name: 'Barracuda Central',
    zone: 'b.barracudacentral.org',
    description: 'Reputation system tracking IP address sending histories.'
  },
  {
    name: 'SpamCop',
    zone: 'bl.spamcop.net',
    description: 'Community-driven IP blacklist tracking user spam complaints.'
  }
];

function reverseIp(ip: string): string {
  return ip.split('.').reverse().join('.');
}

/**
 * Checks domain and host IP reputation across DNSBLs and risk indicators
 */
export async function checkDomainReputation(
  rawInput: string,
  smtpHost: string = 'smtp.gmail.com'
): Promise<DomainReputationReport> {
  const domain = extractDomain(rawInput);
  const now = new Date().toISOString();
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  const blacklistResults: BlacklistCheckResult[] = [];
  const ipResults: BlacklistCheckResult[] = [];
  let resolvedIps: string[] = [];

  if (!domain) {
    throw new Error('A valid domain is required for reputation check.');
  }

  // 1. Check Domain DNSBLs
  for (const bl of DOMAIN_BLACKCHALLENGES) {
    const query = `${domain}.${bl.zone}`;
    try {
      const addresses = await dns.resolve4(query);
      if (addresses && addresses.length > 0) {
        blacklistResults.push({
          listName: bl.name,
          host: bl.zone,
          listed: true,
          response: addresses.join(', '),
          description: bl.description
        });
        riskFactors.push(`Domain is actively listed on ${bl.name} (${addresses.join(', ')})`);
      }
    } catch (err: any) {
      if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'ESERVFAIL') {
        // Not listed (clean)
        blacklistResults.push({
          listName: bl.name,
          host: bl.zone,
          listed: false,
          description: bl.description
        });
      } else {
        blacklistResults.push({
          listName: bl.name,
          host: bl.zone,
          listed: false,
          response: `Lookup failed: ${err.message}`,
          description: bl.description
        });
      }
    }
  }

  // 2. Resolve domain A records and MX IPs
  try {
    const domainA = await dns.resolve4(domain).catch(() => []);
    resolvedIps = [...domainA];

    if (resolvedIps.length === 0) {
      // try resolving mx host
      const mx = await dns.resolveMx(domain).catch(() => []);
      if (mx.length > 0) {
        const mxHost = mx[0].exchange;
        const mxIps = await dns.resolve4(mxHost).catch(() => []);
        resolvedIps.push(...mxIps);
      }
    }
  } catch {
    // ignore
  }

  // 3. Test IP against IP Blacklists if we have an IP
  const targetIp = resolvedIps[0];
  if (targetIp && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(targetIp)) {
    const rev = reverseIp(targetIp);
    for (const bl of IP_BLACKCHALLENGES) {
      const query = `${rev}.${bl.zone}`;
      try {
        const addresses = await dns.resolve4(query);
        if (addresses && addresses.length > 0) {
          ipResults.push({
            listName: bl.name,
            host: bl.zone,
            listed: true,
            response: addresses.join(', '),
            description: bl.description
          });
          riskFactors.push(`Sending IP ${targetIp} is listed on ${bl.name}`);
        }
      } catch {
        ipResults.push({
          listName: bl.name,
          host: bl.zone,
          listed: false,
          description: bl.description
        });
      }
    }
  }

  // 4. Domain Heuristics
  const freeEmailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'mail.com'];
  if (freeEmailProviders.includes(domain)) {
    riskFactors.push(`Sending from a free personal email address (${domain}). B2B inboxes heavily filter personal accounts sending bulk cold outreach.`);
    recommendations.push('Use a dedicated custom business domain (e.g. yourcompany.com) with verified SPF and DKIM.');
  }

  if (smtpHost.includes('gmail.com')) {
    recommendations.push('When sending via Google Workspace SMTP, keep volume under 100-150 cold emails/day per mailbox to maintain Google Postmaster trust.');
  }

  const anyListed = blacklistResults.some(b => b.listed) || ipResults.some(i => i.listed);
  let reputationStatus: 'CLEAN' | 'NEUTRAL' | 'FLAGGED' = 'CLEAN';

  if (anyListed) {
    reputationStatus = 'FLAGGED';
    recommendations.push('Request delisting from the relevant blacklist provider after resolving spam complaint causes.');
  } else if (riskFactors.length > 0) {
    reputationStatus = 'NEUTRAL';
  }

  if (reputationStatus === 'CLEAN') {
    recommendations.push('Domain and IP are not listed on major public blocklists. Maintain this reputation by following volume ramp-up schedules and honoring opt-outs.');
  }

  return {
    domain,
    checkedAt: now,
    reputationStatus,
    blacklistsChecked: blacklistResults,
    ipChecks: ipResults,
    resolvedIps,
    riskFactors,
    recommendations
  };
}
