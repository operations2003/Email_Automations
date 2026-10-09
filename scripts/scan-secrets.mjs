import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();

// Patterns to detect potential secrets
const SECRET_PATTERNS = [
  { name: 'Google App Password', regex: /\b[a-z]{4}\s[a-z]{4}\s[a-z]{4}\s[a-z]{4}\b/gi },
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9_\-]{24,}/g },
  { name: 'Resend API Key', regex: /re_[a-zA-Z0-9_\-]{20,}/g },
  { name: 'AWS Access Key ID', regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g },
  { name: 'Private Key', regex: /-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP)?\s?PRIVATE KEY/g },
  { name: 'MongoDB Connection with Password', regex: /mongodb(?:\+srv)?:\/\/(?!<)[^:]+:([^@]+)@/gi },
  { name: 'Hardcoded SMTP Pass Assignment', regex: /(?:smtpPass|smtp_pass|smtp_password)\s*[:=]\s*['"`]([a-zA-Z0-9\s]{8,})['"`]/gi },
];

// Files / paths allowed to contain example text
const IGNORED_PATHS = [
  /\.example/i,
  /scripts\/scan-secrets\.mjs$/i,
  /node_modules/i,
  /\.git/i,
  /\.next/i,
  /dist/i,
  /build/i
];

// False positive patterns (e.g., standard natural language strings with 4 four-letter words)
const FALSE_POSITIVES = [
  /save your team time/i,
  /work with your team/i,
  /your team will feel/i,
  /slow down this week/i,
  /abcd efgh ijkl mnop/i,
  /••••••••/
];

function mask(str) {
  if (!str || str.length <= 4) return '****';
  return str.slice(0, 2) + '****' + str.slice(-2);
}

function shouldSkip(filePath) {
  return IGNORED_PATHS.some(pattern => pattern.test(filePath));
}

function isFalsePositive(line) {
  return FALSE_POSITIVES.some(fp => fp.test(line));
}

let findingsCount = 0;

try {
  // Get tracked files from git
  const tracked = execSync('git ls-files', { cwd: ROOT_DIR, encoding: 'utf8' })
    .split('\n')
    .map(f => f.trim())
    .filter(Boolean);

  console.log(`[Security Scanner] Auditing ${tracked.length} tracked files for secrets...`);

  for (const file of tracked) {
    if (shouldSkip(file)) continue;

    const fullPath = path.join(ROOT_DIR, file);
    if (!fs.existsSync(fullPath)) continue;

    // Skip binary files
    if (file.match(/\.(png|jpg|jpeg|ico|webp|woff|woff2|ttf|eot|pdf)$/i)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isFalsePositive(line)) continue;

      for (const p of SECRET_PATTERNS) {
        p.regex.lastIndex = 0;
        const match = p.regex.exec(line);
        if (match) {
          // Double check false positive for matched token
          if (isFalsePositive(match[0])) continue;

          console.error(`❌ [LEAK DETECTED] File: ${file}:${i + 1}`);
          console.error(`   Type: ${p.name}`);
          console.error(`   Preview: [REDACTED: ${mask(match[0])}]`);
          findingsCount++;
        }
      }
    }
  }

  if (findingsCount > 0) {
    console.error(`\n🚨 SECURITY SCAN FAILED: ${findingsCount} potential secret(s) found in tracked files!`);
    console.error(`   Remove hardcoded credentials and replace them with environment variables.`);
    process.exit(1);
  } else {
    console.log(`✅ [Security Scanner] PASSED: Zero exposed secrets detected in tracked files.`);
    process.exit(0);
  }
} catch (err) {
  if (findingsCount > 0) {
    process.exit(1);
  }
  console.error('Scan error:', err.message);
  process.exit(1);
}
