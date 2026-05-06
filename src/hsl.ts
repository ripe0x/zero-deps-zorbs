// Drop-in replacement for the single tinycolor2 call this package uses:
//   tinycolor({h, s, l}).toHslString()
//
// tinycolor doesn't just format the input — it pushes HSL → RGB → HSL,
// clamps RGB to [0,255] (without rounding), then rounds h*360, s*100, l*100
// to integers for the output string. To match its output byte-for-byte,
// we reproduce that exact pipeline. The parity test (see test/parity.test.ts)
// is the source of truth.

function bound01(n: number, max: number): number {
  // Faithful port of tinycolor2's bound01 for numeric inputs.
  // (tinycolor also handles percentage strings; we never pass those.)
  const clamped = Math.min(max, Math.max(0, n));
  if (Math.abs(clamped - max) < 0.000001) return 1;
  return (clamped % max) / max;
}

function hueChannel(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  // h in [0,360], s/l in [0,100]; output r/g/b in [0,255] as floats.
  const hN = bound01(h, 360);
  const sN = bound01(s, 100);
  const lN = bound01(l, 100);

  if (sN === 0) {
    const v = lN * 255;
    return [v, v, v];
  }
  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
  const p = 2 * lN - q;
  return [
    hueChannel(p, q, hN + 1 / 3) * 255,
    hueChannel(p, q, hN) * 255,
    hueChannel(p, q, hN - 1 / 3) * 255,
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rN) {
    h = (gN - bN) / d + (gN < bN ? 6 : 0);
  } else if (max === gN) {
    h = (bN - rN) / d + 2;
  } else {
    h = (rN - gN) / d + 4;
  }
  return [h / 6, s, l];
}

export function hslString(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  // tinycolor clamps RGB to [0,255] without rounding before round-tripping.
  const rC = Math.min(255, Math.max(0, r));
  const gC = Math.min(255, Math.max(0, g));
  const bC = Math.min(255, Math.max(0, b));
  const [hN, sN, lN] = rgbToHsl(rC, gC, bC);
  return `hsl(${Math.round(hN * 360)}, ${Math.round(sN * 100)}%, ${Math.round(lN * 100)}%)`;
}
