import assert from 'assert';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log('🧪 Starting Security & Email Configuration Test Suite...\n');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// 1. Verify Git Ignore for Sensitive Files
runTest('Verify .gitignore excludes .env and .env.local', () => {
  const checkEnv = execSync('git check-ignore .env', { encoding: 'utf8' }).trim();
  assert.strictEqual(checkEnv, '.env', '.env must be ignored by git');

  const checkEnvLocal = execSync('git check-ignore .env.local', { encoding: 'utf8' }).trim();
  assert.strictEqual(checkEnvLocal, '.env.local', '.env.local must be ignored by git');
});

// 2. Verify .env.example contains only placeholders
runTest('Verify .env.example exists and contains no real credentials', () => {
  assert(fs.existsSync('.env.example'), '.env.example must exist');
  const content = fs.readFileSync('.env.example', 'utf8');
  assert(content.includes('your_company_email@example.com'), 'Must contain placeholder email');
  assert(content.includes('your_new_app_password'), 'Must contain placeholder password');
  assert(content.includes('SMTP_HOST'), 'Must specify SMTP_HOST');
  assert(content.includes('SMTP_PORT'), 'Must specify SMTP_PORT');
  assert(!/\b[a-z]{4}\s[a-z]{4}\s[a-z]{4}\s[a-z]{4}\b/.test(content), 'Must not contain any 16-letter app password format');
  assert(!content.includes('sk-proj'), 'Must not contain any real OpenAI key');
});

// 3. Verify settings.ts has no hardcoded secrets in source code
runTest('Verify src/lib/settings.ts contains no hardcoded email password', () => {
  const content = fs.readFileSync('src/lib/settings.ts', 'utf8');
  assert(!/smtpPass:\s*['"][a-z]{4}\s/i.test(content), 'Must not contain hardcoded app password');
  assert(content.includes('process.env.EMAIL_PASSWORD'), 'Must use process.env.EMAIL_PASSWORD');
  assert(content.includes('process.env.EMAIL_USER'), 'Must use process.env.EMAIL_USER');
});

// 4. Test missing SMTP configuration error message safety
runTest('Verify SMTP configuration validation logic safely checks required credentials', () => {
  const emailServiceContent = fs.readFileSync('src/lib/email-service.ts', 'utf8');
  assert(emailServiceContent.includes('SMTP Configuration incomplete'), 'Must contain safe error message for missing config');
  assert(emailServiceContent.includes('EMAIL_PASSWORD'), 'Must check EMAIL_PASSWORD');
  assert(emailServiceContent.includes('EMAIL_USER'), 'Must check EMAIL_USER');
  assert(!emailServiceContent.includes('console.log(smtpPass)'), 'Must never log password');
  assert(!emailServiceContent.includes('console.log(settings.smtpPass)'), 'Must never log settings.smtpPass');
});

// 5. Verify API route masks passwords
runTest('Verify GET /api/settings masks smtpPass for all users', () => {
  const settingsRouteContent = fs.readFileSync('src/app/api/settings/route.ts', 'utf8');
  assert(settingsRouteContent.includes('smtpPass: settings.smtpPass ? \'••••••••\' : \'\''), 'Must mask smtpPass in GET');
  assert(settingsRouteContent.includes('delete body.smtpPass;'), 'Must preserve existing password when masked in POST');
});

// 6. Verify tracked files secret scan passes
runTest('Verify security scan on all tracked repository files', () => {
  const out = execSync('node scripts/scan-secrets.mjs', { encoding: 'utf8' });
  assert(out.includes('PASSED: Zero exposed secrets detected'), 'Scanner must pass');
});

console.log(`\n========================================`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
