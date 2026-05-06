// Deterministic address corpus for parity testing.
//
// Goals:
//   - Cover edges (zero, max, alternating bits) where byte sampling is most
//     likely to expose off-by-one errors.
//   - Cover a large random sample for broad behavioural coverage.
//   - Cover case variants — zorb's input flows through ethers' arrayify which
//     is case-insensitive; we must be too.
//   - Cover famous addresses for sanity / readable failure messages.
//
// Reproducibility: PRNG is Mulberry32 seeded with 0xDEADBEEF. Same seed →
// same corpus → same test outcome forever.

const EDGE_ADDRESSES: string[] = [
  '0x0000000000000000000000000000000000000000',
  '0xffffffffffffffffffffffffffffffffffffffff',
  '0x0000000000000000000000000000000000000001',
  '0x1000000000000000000000000000000000000000',
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '0x5555555555555555555555555555555555555555',
  '0xaa55aa55aa55aa55aa55aa55aa55aa55aa55aa55',
  '0x55aa55aa55aa55aa55aa55aa55aa55aa55aa55aa',
  '0x0123456789abcdef0123456789abcdef01234567',
  '0xfedcba9876543210fedcba9876543210fedcba98',
];

const FAMOUS_ADDRESSES: string[] = [
  // Vitalik Buterin's well-known address
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  // The "burn" address
  '0x000000000000000000000000000000000000dead',
  // Foundation deployer-ish (just an address with mixed bits)
  '0xcb2faa57e0ce5d40b3a5af55fbb0e8e8a8b2e9e1',
  '0x0a59649758aa4d66e25f08dd01271e891fe52199',
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
];

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomAddress(rng: () => number): string {
  let hex = '0x';
  for (let i = 0; i < 20; i++) {
    const b = Math.floor(rng() * 256);
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

function generateRandomAddresses(count: number, seed = 0xdeadbeef): string[] {
  const rng = mulberry32(seed);
  return Array.from({ length: count }, () => randomAddress(rng));
}

function caseVariants(addr: string): string[] {
  const lower = addr.toLowerCase();
  const upper = '0x' + lower.slice(2).toUpperCase();
  // Pseudo-checksum: alternating case (good enough — arrayify is case-insensitive).
  let mixed = '0x';
  for (let i = 2; i < lower.length; i++) {
    mixed += i % 2 === 0 ? lower[i]!.toUpperCase() : lower[i]!;
  }
  return [lower, upper, mixed];
}

export const RANDOM_COUNT = 2000;

export const RANDOM_ADDRESSES = generateRandomAddresses(RANDOM_COUNT);

export const CASE_VARIANT_PAIRS: { base: string; variants: string[] }[] = (() => {
  // 100 addresses' worth of case variants, drawn from the random corpus.
  const sample = RANDOM_ADDRESSES.slice(0, 100);
  return sample.map((base) => ({ base, variants: caseVariants(base) }));
})();

// Full corpus for the “every input must produce identical output” test.
export const FULL_CORPUS: string[] = [
  ...EDGE_ADDRESSES,
  ...FAMOUS_ADDRESSES,
  ...RANDOM_ADDRESSES,
  ...CASE_VARIANT_PAIRS.flatMap((p) => p.variants),
];

// Subset used for the visual side-by-side report (Layer 3).
export const VISUAL_SAMPLE: string[] = [
  ...EDGE_ADDRESSES,
  ...FAMOUS_ADDRESSES,
  ...RANDOM_ADDRESSES.slice(0, 35),
];
