// Layer 3: visual side-by-side report.
//
// For ~50 sample addresses, render *both* the upstream zorb and ours next
// to each other in a static HTML grid, with an automatic match indicator
// per row. Even though Layer 1 already proves byte equality, opening this
// page is the most convincing single artifact.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { zorbImageDataURI as upstreamDataURI } from '@zoralabs/zorb';

import { zorbDataURI } from '../src/index.js';
import { VISUAL_SAMPLE } from '../test/corpus.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = join(root, 'reports');
mkdirSync(reportsDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);

let totalMatch = 0;

const rows = VISUAL_SAMPLE.map((addr) => {
  const ours = zorbDataURI(addr);
  const up = upstreamDataURI(addr);
  const match = ours === up;
  if (match) totalMatch++;
  const indicator = match
    ? '<span style="color:#0a0">match</span>'
    : '<span style="color:#a00">DIFFER</span>';
  return `<tr>
    <td><code>${addr}</code></td>
    <td><img src="${up}" width="64" height="64" alt="upstream" /></td>
    <td><img src="${ours}" width="64" height="64" alt="ours" /></td>
    <td>${indicator}</td>
  </tr>`;
}).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>zero-deps-zorbs — parity report (${today})</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem; max-width: 1100px; }
    h1 { margin-bottom: 0.25rem; }
    .summary { color: #555; margin-bottom: 1.5rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; vertical-align: middle; }
    th { text-align: left; background: #fafafa; }
    code { font: 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
    img { display: block; border-radius: 50%; }
  </style>
</head>
<body>
  <h1>zero-deps-zorbs vs <code>@zoralabs/zorb</code></h1>
  <p class="summary">${totalMatch} / ${VISUAL_SAMPLE.length} sample addresses match byte-for-byte. Generated ${today}.</p>
  <table>
    <thead>
      <tr><th>Address</th><th>Upstream</th><th>Ours</th><th>Status</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>
`;

writeFileSync(join(reportsDir, 'visual.html'), html);
console.log(`Wrote reports/visual.html — ${totalMatch}/${VISUAL_SAMPLE.length} match`);
if (totalMatch !== VISUAL_SAMPLE.length) process.exit(1);
