import assert from 'node:assert';
import { generateOutreachEmail, validateEmailQuality } from '../src/lib/ai-engine.ts';
import { verifyDomainDns } from '../src/lib/dns-validator.ts';
import { checkDomainReputation } from '../src/lib/reputation-checker.ts';
import { isSuppressed, addToSuppression, removeFromSuppression, generateUnsubscribeToken, getUnsubscribeHeaders } from '../src/lib/suppression.ts';

let passed = 0;
let total = 0;

async function test(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`, err);
  }
}

console.log('🧪 Starting Deliverability, DNS, Spam Prevention & Unsubscribe Suite...\n');

// 1. Content generation and variation test
await test('Anti-Spam Dynamic Content: Generates professional outreach email without placeholders', async () => {
  const email1 = await generateOutreachEmail({
    companyName: 'Tasknera',
    recipientEmail: 'sakshi@example.com',
    recipientName: 'Sakshi',
    mailTopic: 'software_solutions',
    reason: 'HR Technology & Digital Solutions'
  });

  assert.ok(email1.body.length > 50, 'Email body should have content');
  assert.ok(email1.subject.length > 5, 'Email should have subject');
  assert.ok(email1.qualityPassed, `Quality should pass. Notes: ${email1.qualityNotes.join(', ')}`);
  assert.ok(!email1.body.includes('{{'), 'No unrendered placeholders');
  assert.ok(Array.isArray(email1.alternativeSubjects) && email1.alternativeSubjects.length > 0, 'Should provide alternative subject lines');
});

// 2. Spam quality validator test
await test('Spam Quality Validator: Flags spam clichés and excessive exclamation marks', async () => {
  const spamAssessment = validateEmailQuality(
    'FREE URGENT OFFER FOR TASKNERA',
    'Dear Sakshi, Act now for guaranteed 100% free money!!! Click here now!',
    'Tasknera',
    'HR Tech'
  );
  assert.strictEqual(spamAssessment.valid, false, 'Spammy text should fail quality checks');
  assert.ok(spamAssessment.notes.some(n => n.includes('Spam') || n.includes('exclamation') || n.includes('words')), 'Notes should highlight spam issues');

  const cleanAssessment = validateEmailQuality(
    'Workflow automation for Tasknera',
    'Hi Sakshi, I noticed Tasknera is expanding its team operations and wanted to share how modern workflow integration helps eliminate manual bottlenecks between departments. We recently helped similar organizations unify their HR and CRM processes with measurable productivity gains. Would you be open to a brief 10-minute introductory conversation next Tuesday?',
    'Tasknera',
    'HR Tech'
  );
  assert.strictEqual(cleanAssessment.checks.noSpamCliches, true, 'Clean text should pass clichés check');
});

// 3. Suppression & RFC 8058 Unsubscribe Engine
await test('RFC 8058 Unsubscribe: Generates compliant List-Unsubscribe headers & tokens', async () => {
  const token = generateUnsubscribeToken('test@tasknera.com', 'camp-123');
  assert.ok(token && token.length > 10, 'Token should be generated');

  const headers = getUnsubscribeHeaders('test@tasknera.com', 'camp-123', 'https://sheetoutreach.com');
  assert.ok(headers['List-Unsubscribe'], 'Should have List-Unsubscribe header');
  assert.ok(headers['List-Unsubscribe'].includes('https://sheetoutreach.com/api/unsubscribe'), 'Header must contain HTTPS URL');
  assert.ok(headers['List-Unsubscribe'].includes('mailto:'), 'Header must contain mailto');
  assert.strictEqual(headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click', 'RFC 8058 requires List-Unsubscribe=One-Click');
});

// 4. Suppression List Workflow
await test('Suppression Management: Prevents outreach to opted-out or bounced recipients', async () => {
  const testEmail = `optout-${Date.now()}@example.com`;
  
  assert.strictEqual(await isSuppressed(testEmail), false, 'Initially email should not be suppressed');
  
  await addToSuppression(testEmail, 'unsubscribe', 'camp-456', 'Recipient opted out via link');
  assert.strictEqual(await isSuppressed(testEmail), true, 'Email must be recognized as suppressed');
  
  await removeFromSuppression(testEmail);
  assert.strictEqual(await isSuppressed(testEmail), false, 'Email should no longer be suppressed after removal');
});

// 5. Live DNS Authentication Check
await test('Live DNS Verification: Verifies SPF, DKIM, and DMARC for tasknera.com', async () => {
  const result = await verifyDomainDns('tasknera.com');
  assert.strictEqual(result.domain, 'tasknera.com');
  assert.ok(result.spf.rawRecord !== null && result.spf.found, 'tasknera.com should have SPF record');
  assert.strictEqual(result.spf.status, 'pass', 'tasknera.com SPF should pass');
  assert.ok(result.dmarc.rawRecord !== null && result.dmarc.found, 'tasknera.com should have DMARC record');
  assert.strictEqual(result.dmarc.status, 'pass', 'tasknera.com DMARC should pass');
  assert.ok(result.dkim.selectorsChecked.length > 0, 'DKIM selectors should be checked');
  assert.ok(result.overallScore >= 70, 'Overall authentication score should be high');
});

// 6. Blocklist Reputation Check
await test('Blocklist Reputation: Verifies sender domain against DNSBLs', async () => {
  const rep = await checkDomainReputation('tasknera.com');
  assert.strictEqual(rep.domain, 'tasknera.com');
  assert.strictEqual(rep.reputationStatus, 'CLEAN', 'tasknera.com reputation should be CLEAN');
  const blacklistedCount = rep.blacklistsChecked.filter(b => b.listed).length;
  assert.strictEqual(blacklistedCount, 0, 'Should have 0 blacklist listings');
});

console.log('\n========================================');
console.log(`Total: ${total} | Passed: ${passed} | Failed: ${total - passed}`);
console.log('========================================\n');

if (passed !== total) {
  process.exit(1);
}
