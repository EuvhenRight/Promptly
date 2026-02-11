#!/usr/bin/env node
/**
 * Sync Stripe env vars from .env to Firebase App Hosting:
 *   - Writes NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_CURRENCY to apphosting.yaml
 *   - Runs firebase apphosting:secrets:set for STRIPE_SECRET_KEY
 * Run: node scripts/sync-stripe-to-firebase.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const yamlPath = path.join(root, 'apphosting.yaml');

function getEnvVar(name) {
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(new RegExp(`^${name}=(.*)$`, 'm'));
  if (!match) return null;
  return match[1].replace(/^["']|["']$/g, '').trim();
}

const publishableKey = getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
const currency = getEnvVar('STRIPE_CURRENCY') || 'eur';
const secretKey = getEnvVar('STRIPE_SECRET_KEY');

if (!publishableKey) {
  console.error('Error: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in .env');
  process.exit(1);
}
if (!secretKey) {
  console.error('Error: STRIPE_SECRET_KEY not found in .env');
  process.exit(1);
}

// Update apphosting.yaml
if (fs.existsSync(yamlPath)) {
  let yaml = fs.readFileSync(yamlPath, 'utf8');
  yaml = yaml.replace(
    /(variable: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\s*\n\s+value: ).*/,
    `$1${publishableKey}`
  );
  yaml = yaml.replace(
    /(variable: STRIPE_CURRENCY\s*\n\s+value: ).*/,
    `$1${currency}`
  );
  fs.writeFileSync(yamlPath, yaml);
  console.log('Updated apphosting.yaml with publishable key and STRIPE_CURRENCY=' + currency);
} else {
  console.warn('Warning: apphosting.yaml not found');
}

// Set secret via Firebase CLI
try {
  execSync('firebase apphosting:secrets:set STRIPE_SECRET_KEY --data-file -', {
    input: secretKey,
    cwd: root,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  console.log('Set STRIPE_SECRET_KEY in Firebase Secret Manager.');
} catch (e) {
  console.error('Failed to set secret. Run: firebase apphosting:secrets:set STRIPE_SECRET_KEY');
  process.exit(1);
}

console.log('Done. All three Stripe values from .env are synced to Firebase.');
console.log('If needed: firebase apphosting:secrets:grantaccess STRIPE_SECRET_KEY --backend YOUR_BACKEND_ID');
