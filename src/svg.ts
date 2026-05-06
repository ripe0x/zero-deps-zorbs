// SVG template — must match @zoralabs/zorb's zorbImageSVG byte-for-byte,
// including leading/trailing whitespace inside the template literal.
// Verified against upstream by test/parity.test.ts.

import { gradientForAddress, type ZorbGradient } from './gradient.js';

export const zorbSVG = (address: string): string => {
  const c: ZorbGradient = gradientForAddress(address);
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110">
  <defs>
    <radialGradient
      id="gzr"
      gradientTransform="translate(66.4578 24.3575) scale(75.2908)"
      gradientUnits="userSpaceOnUse"
      r="1"
      cx="0"
      cy="0%"
      >
      <stop offset="15.62%" stop-color="${c[0]}" />
      <stop offset="39.58%" stop-color="${c[1]}" />
      <stop offset="72.92%" stop-color="${c[2]}" />
      <stop offset="90.63%" stop-color="${c[3]}" />
      <stop offset="100%" stop-color="${c[4]}" />
    </radialGradient>
  </defs>
  <g transform="translate(5,5)">
    <path
      d="M100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100C77.6142 100 100 77.6142 100 50Z"
      fill="url(#gzr)"
    /><path
      stroke="rgba(0,0,0,0.075)"
      fill="transparent"
      stroke-width="1"
      d="M50,0.5c27.3,0,49.5,22.2,49.5,49.5S77.3,99.5,50,99.5S0.5,77.3,0.5,50S22.7,0.5,50,0.5z"
    />
  </g>
</svg>
  `;
};

const toBase64 = (s: string): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(s, 'utf-8').toString('base64');
  }
  // Browser fallback: encode as UTF-8 first, then btoa.
  // (btoa can't handle non-Latin1 directly, but the SVG template is ASCII so
  // a plain btoa would also work — the encode step is defensive.)
  const bytes = new TextEncoder().encode(s);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
};

export const zorbDataURI = (address: string): string =>
  `data:image/svg+xml;base64,${toBase64(zorbSVG(address))}`;
