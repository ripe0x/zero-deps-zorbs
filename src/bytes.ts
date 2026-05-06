// Drop-in replacement for `arrayify` from @ethersproject/bytes,
// scoped to the only thing this package needs: parsing 0x-prefixed hex
// strings into a Uint8Array.

export function arrayify(hex: string): Uint8Array {
  if (typeof hex !== 'string') {
    throw new Error(`invalid hex string: ${String(hex)}`);
  }
  if (!/^0x[0-9a-fA-F]*$/.test(hex)) {
    throw new Error(`invalid hex string: ${hex}`);
  }
  if (hex.length % 2 !== 0) {
    throw new Error(`invalid hex string (odd length): ${hex}`);
  }
  const out = new Uint8Array((hex.length - 2) / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
  }
  return out;
}
