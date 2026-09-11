/**
 * VOID X ARENA — Production Secret Leakage Scanner
 * Scans client-accessible bundles, public assets, and mobile scaffolding
 * to guarantee no sensitive server credentials, API secrets, or private keys leak to users.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const FORBIDDEN_ENV_KEYS = [
  'DATABASE_URL',
  'CASHFREE_CLIENT_SECRET',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'WEBHOOK_SECRET',
  'ADMIN_TOKEN_SECRET',
];

const SENSITIVE_PATTERNS = [
  /postgres(?:ql)?:\/\/[^:]+:[^@]+@/i, // PostgreSQL connection string with password
  /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i, // RSA / EC private keys
  /cfsk_ma_[0-9a-zA-Z_-]{20,}/i, // Cashfree live/prod secret key pattern
  /eyJhbGciOi[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/, // Hardcoded JWT tokens
];

const SCAN_DIRS = ['public', 'android', 'src/components', 'out'];
const IGNORE_DIRS = ['node_modules', '.git', '.next', 'data', 'test', 'dist'];
const IGNORE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.mp4'];

let totalFilesScanned = 0;
const violations = [];

// Read current .env to check if any active secret string values are hardcoded in client files
const envSecrets = [];
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, '').trim();
      if (FORBIDDEN_ENV_KEYS.includes(key) && val.length > 5) {
        envSecrets.push({ key, val });
      }
    }
  }
}

function scanFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORE_EXTS.includes(ext)) return;

  totalFilesScanned++;
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(ROOT_DIR, filePath);

  // Check for forbidden secret values
  for (const secret of envSecrets) {
    if (content.includes(secret.val)) {
      violations.push({
        file: relPath,
        type: 'ACTIVE_SECRET_LEAK',
        detail: `File contains actual value of ${secret.key}`,
      });
    }
  }

  // Check for forbidden environment variable client usage
  for (const key of FORBIDDEN_ENV_KEYS) {
    // If it's a client component with 'use client'
    if (content.includes("'use client'") || content.includes('"use client"')) {
      if (content.includes(`process.env.${key}`) || content.includes(`process.env['${key}']`)) {
        violations.push({
          file: relPath,
          type: 'CLIENT_ENV_REFERENCE',
          detail: `Client component references forbidden server env var: process.env.${key}`,
        });
      }
    }
  }

  // Check for regex sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(content)) {
      violations.push({
        file: relPath,
        type: 'SENSITIVE_PATTERN_MATCH',
        detail: `Matched sensitive regex: ${pattern.toString()}`,
      });
    }
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.includes(entry.name)) {
        walkDir(fullPath);
      }
    } else if (entry.isFile()) {
      scanFile(fullPath);
    }
  }
}

console.log('================================================================');
console.log('🔍 VOID X ARENA — CLIENT & BUNDLE SECRET SCANNER');
console.log('================================================================');
console.log(`Scanning target directories: ${SCAN_DIRS.join(', ')}`);
console.log(`Watching for ${envSecrets.length} active secrets and ${FORBIDDEN_ENV_KEYS.length} forbidden variables...\n`);

for (const dir of SCAN_DIRS) {
  walkDir(path.join(ROOT_DIR, dir));
}

console.log(`Total files inspected: ${totalFilesScanned}`);

if (violations.length > 0) {
  console.error(`\n❌ FOUND ${violations.length} SECURITY LEAK VIOLATIONS:`);
  violations.forEach((v, idx) => {
    console.error(`  ${idx + 1}. [${v.type}] in ${v.file}: ${v.detail}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ CLEAN: Zero forbidden server secrets or credential leaks detected in client assets!');
  process.exit(0);
}
