// Verbatim port of @zoralabs/zorb's lib.ts gradient algorithm.
// Source: https://github.com/ourzora/zorb/blob/main/packages/zorb-web-component/src/lib.ts
// Behaviour preserved exactly: same byte indices, same constants, same easing curves.

import { arrayify } from './bytes.js';
import { hslString } from './hsl.js';

const linear = (p: number) => p;

const cubicInOut = (p: number) => {
  const m = p - 1;
  const t = p * 2;
  if (t < 1) return p * t * t;
  return 1 + m * m * m * 4;
};

const cubicIn = (p: number) => p * p * p;

const quintIn = (p: number) => p * p * p * p * p;

const bscale = (byte: number, max: number) => Math.round((byte / 255) * max);

const clampHue = (h: number) => {
  if (h >= 0) return h % 360.0;
  return 360 + (h % 360);
};

const bScaleRange = (byte: number, min: number, max: number) =>
  bscale(byte, max - min) + min;

type HueFn = (hue: number, pct: number) => number;
type LerpFn = (start: number, end: number, pct: number) => number;

export const lerpHueFn = (optionNum: number, direction: number): HueFn => {
  const option = optionNum % 4;
  const multiplier = direction ? 1 : -1;
  switch (option) {
    case 0:
      return (hue, pct) => {
        const endHue = hue + multiplier * 10;
        return clampHue(linear(1.0 - pct) * hue + linear(pct) * endHue);
      };
    case 1:
      return (hue, pct) => {
        const endHue = hue + multiplier * 30;
        return clampHue(linear(1.0 - pct) * hue + linear(pct) * endHue);
      };
    case 2:
      return (hue, pct) => {
        const endHue = hue + multiplier * 50;
        const lerpPercent = cubicInOut(pct);
        return clampHue(linear(1.0 - lerpPercent) * hue + lerpPercent * endHue);
      };
    case 3:
    default:
      return (hue, pct) => {
        const endHue = hue + multiplier * 60 * bscale(optionNum, 1.0) + 30;
        const lerpPercent = cubicInOut(pct);
        return clampHue((1.0 - lerpPercent) * hue + lerpPercent * endHue);
      };
  }
};

const lerpLightnessFn = (optionNum: number): LerpFn => {
  switch (optionNum) {
    case 0:
      return (start, end, pct) => {
        const lerpPercent = quintIn(pct);
        return (1.0 - lerpPercent) * start + lerpPercent * end;
      };
    case 1:
    default:
      return (start, end, pct) => {
        const lerpPercent = cubicIn(pct);
        return (1.0 - lerpPercent) * start + lerpPercent * end;
      };
  }
};

const lerpSaturationFn = (optionNum: number): LerpFn => {
  switch (optionNum) {
    case 0:
      return (start, end, pct) => {
        const lerpPercent = quintIn(pct);
        return (1.0 - lerpPercent) * start + lerpPercent * end;
      };
    case 1:
    default:
      return (start, end, pct) => {
        const lerpPercent = linear(pct);
        return (1.0 - lerpPercent) * start + lerpPercent * end;
      };
  }
};

export type ZorbGradient = readonly [string, string, string, string, string];

export const gradientForAddress = (address: string): ZorbGradient => {
  const bytes = arrayify(address).reverse();

  // Indexed access on a Uint8Array can be `number | undefined` under
  // noUncheckedIndexedAccess; we coerce because we know the corpus only
  // ever passes 20-byte addresses.
  const b = (i: number): number => {
    const v = bytes[i];
    if (v === undefined) {
      throw new Error(`zero-deps-zorbs: address bytes too short (need at least 13 bytes, got ${bytes.length})`);
    }
    return v;
  };

  const hueShiftFn = lerpHueFn(b(3), b(6) % 2);
  const startHue = bscale(b(12), 360);
  const startLightness = bScaleRange(b(2), 32, 69.5);
  const endLightness = (97 + bScaleRange(b(8), 72, 97)) / 2;
  const startSaturation = bScaleRange(b(7), 81, 97);
  const endSaturation = Math.min(
    startSaturation - 10,
    bScaleRange(b(10), 70, 92),
  );

  const lightnessShiftFn = lerpLightnessFn(b(5) % 2);
  const saturationShiftFn = lerpSaturationFn(b(3) % 2);

  return [
    hslString(
      hueShiftFn(startHue, 0),
      saturationShiftFn(startSaturation, endSaturation, 1),
      lightnessShiftFn(startLightness, endLightness, 1),
    ),
    hslString(
      hueShiftFn(startHue, 0.1),
      saturationShiftFn(startSaturation, endSaturation, 0.9),
      lightnessShiftFn(startLightness, endLightness, 0.9),
    ),
    hslString(
      hueShiftFn(startHue, 0.7),
      saturationShiftFn(startSaturation, endSaturation, 0.7),
      lightnessShiftFn(startLightness, endLightness, 0.7),
    ),
    hslString(
      hueShiftFn(startHue, 0.9),
      saturationShiftFn(startSaturation, endSaturation, 0.2),
      lightnessShiftFn(startLightness, endLightness, 0.2),
    ),
    hslString(
      hueShiftFn(startHue, 1),
      saturationShiftFn(startSaturation, endSaturation, 0),
      startLightness,
    ),
  ] as const;
};
