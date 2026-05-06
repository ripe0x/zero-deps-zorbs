// Layer 1: byte-for-byte parity vs the real @zoralabs/zorb.
//
// We import the *actual* upstream library and compare three artifacts per
// input. Any single divergence fails the suite.

import { describe, expect, it } from 'vitest';
import { lib as upstreamLib, zorbImageDataURI as upstreamDataURI } from '@zoralabs/zorb';

import { gradientForAddress, zorbDataURI, zorbSVG } from '../src/index.js';
import { CASE_VARIANT_PAIRS, FULL_CORPUS } from './corpus.js';

const decodeDataUri = (uri: string): string => {
  const idx = uri.indexOf(',');
  return Buffer.from(uri.slice(idx + 1), 'base64').toString('utf8');
};

describe('parity: gradientForAddress', () => {
  it.each(FULL_CORPUS)('matches upstream for %s', (addr) => {
    expect(gradientForAddress(addr)).toEqual(upstreamLib.gradientForAddress(addr));
  });
});

describe('parity: zorbDataURI', () => {
  it.each(FULL_CORPUS)('matches upstream base64 for %s', (addr) => {
    expect(zorbDataURI(addr)).toBe(upstreamDataURI(addr));
  });
});

describe('parity: decoded SVG', () => {
  // Sample the corpus for SVG diffs — same information as the data-URI test
  // (if base64 strings match, decoded strings match), but produces readable
  // failure messages when something goes wrong. 50 inputs is enough to catch
  // any structural template issue.
  const svgSample = FULL_CORPUS.slice(0, 50);

  it.each(svgSample)('decoded SVG matches upstream for %s', (addr) => {
    expect(zorbSVG(addr)).toBe(decodeDataUri(upstreamDataURI(addr)));
  });
});

describe('case insensitivity', () => {
  it.each(CASE_VARIANT_PAIRS)('all case variants of $base produce identical output', ({ variants }) => {
    const outputs = new Set(variants.map((v) => zorbDataURI(v)));
    expect(outputs.size).toBe(1);
  });
});
