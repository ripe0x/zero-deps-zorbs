// Layer 4: bundle audit.
//
// Guards against dependency creep and bundle bloat. Run after `npm run build`.
// Fails if:
//   - any forbidden module name appears in the bundle (ethers/tinycolor/etc.)
//   - bundle exceeds the size cap
//   - package.json's runtime `dependencies` is non-empty

import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FORBIDDEN = ['@ethersproject', 'ethers', 'tinycolor', 'keccak', 'web3'];
const SIZE_CAP_BYTES = 5 * 1024;

interface Failure {
  file: string;
  reason: string;
}
const failures: Failure[] = [];

for (const fname of ['index.js', 'index.cjs']) {
  const path = join(root, 'dist', fname);
  let body: string;
  try {
    body = readFileSync(path, 'utf8');
  } catch {
    failures.push({ file: fname, reason: 'missing — run `npm run build` first' });
    continue;
  }
  const size = statSync(path).size;
  if (size > SIZE_CAP_BYTES) {
    failures.push({ file: fname, reason: `size ${size} bytes exceeds cap ${SIZE_CAP_BYTES}` });
  }
  for (const term of FORBIDDEN) {
    if (body.includes(term)) {
      failures.push({ file: fname, reason: `bundle contains forbidden term "${term}"` });
    }
  }
  console.log(`  ${fname}: ${size} bytes`);
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const runtimeDeps = Object.keys(pkg.dependencies ?? {});
if (runtimeDeps.length > 0) {
  failures.push({
    file: 'package.json',
    reason: `runtime dependencies must be empty, found: ${runtimeDeps.join(', ')}`,
  });
}

if (failures.length > 0) {
  console.error('\nAUDIT FAILED');
  for (const f of failures) console.error(`  [${f.file}] ${f.reason}`);
  process.exit(1);
}
console.log('\nAudit passed: zero runtime deps, no forbidden terms, under size cap.');
