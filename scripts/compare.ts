// Layer 2: parity report.
//
// Iterates the full corpus, collects every divergence (instead of failing
// fast like vitest), and writes machine + human readable reports to
// `reports/`. Exits non-zero if any divergence is found, so CI breaks
// loudly without needing per-input grep.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { lib as upstreamLib, zorbImageDataURI as upstreamDataURI } from '@zoralabs/zorb';

import { gradientForAddress, zorbDataURI } from '../src/index.js';
import { FULL_CORPUS } from '../test/corpus.js';

interface Divergence {
  address: string;
  kind: 'gradient' | 'dataURI';
  ours: unknown;
  upstream: unknown;
}

function diffArrays(a: readonly string[], b: readonly string[]): string[] {
  const lines: string[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) lines.push(`  [${i}] ours=${a[i]}  upstream=${b[i]}`);
  }
  return lines;
}

function main(): number {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const reportsDir = join(root, 'reports');
  mkdirSync(reportsDir, { recursive: true });

  const divergences: Divergence[] = [];
  let identical = 0;

  for (const addr of FULL_CORPUS) {
    const oursGrad = gradientForAddress(addr);
    const upGrad = upstreamLib.gradientForAddress(addr);
    const oursURI = zorbDataURI(addr);
    const upURI = upstreamDataURI(addr);

    const gradMatches = oursGrad.length === upGrad.length && oursGrad.every((v, i) => v === upGrad[i]);
    const uriMatches = oursURI === upURI;

    if (!gradMatches) {
      divergences.push({ address: addr, kind: 'gradient', ours: oursGrad, upstream: upGrad });
    }
    if (!uriMatches) {
      divergences.push({ address: addr, kind: 'dataURI', ours: oursURI, upstream: upURI });
    }
    if (gradMatches && uriMatches) identical++;
  }

  const total = FULL_CORPUS.length;
  const divergent = total - identical;
  const today = new Date().toISOString().slice(0, 10);

  const json = {
    date: today,
    upstream: '@zoralabs/zorb@0.1.0',
    inputs_tested: total,
    identical,
    divergent,
    divergences: divergences.slice(0, 100), // cap for sanity
  };
  writeFileSync(join(reportsDir, 'parity-report.json'), JSON.stringify(json, null, 2));

  let md = `# Parity report — ${today}\n\n`;
  md += `- Upstream: \`@zoralabs/zorb@0.1.0\`\n`;
  md += `- Inputs tested: ${total}\n`;
  md += `- Identical: ${identical}\n`;
  md += `- Divergent: ${divergent}\n\n`;

  if (divergent === 0) {
    md += `**Result: PASS — every input produced byte-for-byte identical output.**\n`;
  } else {
    md += `**Result: FAIL — ${divergent} divergence(s) found.**\n\n`;
    md += `## First divergences (up to 20)\n\n`;
    for (const d of divergences.slice(0, 20)) {
      md += `### ${d.address} (${d.kind})\n\n`;
      if (d.kind === 'gradient') {
        md += '```\n';
        md += diffArrays(d.ours as string[], d.upstream as string[]).join('\n');
        md += '\n```\n\n';
      } else {
        md += `- ours:     \`${d.ours}\`\n`;
        md += `- upstream: \`${d.upstream}\`\n\n`;
      }
    }
  }
  writeFileSync(join(reportsDir, 'parity-report.md'), md);

  console.log(`Wrote reports/parity-report.json + .md`);
  console.log(`  inputs: ${total}  identical: ${identical}  divergent: ${divergent}`);

  return divergent === 0 ? 0 : 1;
}

process.exit(main());
