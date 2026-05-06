# zero-deps-zorbs

Tiny, zero-dependency generator for [Zora](https://github.com/ourzora/zorb)-style
gradient avatars from Ethereum addresses. Drop one in anywhere a user needs a
deterministic fallback PFP.

```ts
import { zorbDataURI } from 'zero-deps-zorbs';

<img src={zorbDataURI('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')} alt="" />
```

Output is **byte-for-byte identical** to Zora's [`@zoralabs/zorb`](https://github.com/ourzora/zorb/tree/main/packages/zorb-web-component)
across every input we've tested (~2,300 addresses; see [Verification](#verification)).
Bundle is **3.6 KB minified**. No runtime dependencies.

## What this is

A pure-function library that turns any 20-byte hex string into the same
5-stop radial-gradient SVG zorb that Zora's library produces. Three exports:

```ts
gradientForAddress(addr): [string, string, string, string, string]  // 5 hsl() stops
zorbSVG(addr): string                                                // full SVG markup
zorbDataURI(addr): string                                            // data:image/svg+xml;base64,…
```

Works in Node, Bun, edge runtimes, React Server Components, and the browser
without any setup. No DOM required, no React peer dep, no web-component
registration step — just functions.

## Why this exists

Zora's [`@zoralabs/zorb`](https://github.com/ourzora/zorb) is the original
implementation. It's a Svelte-compiled web component that ships with two
runtime dependencies the algorithm doesn't actually need:

- **`@ethersproject/bytes`** — used solely to parse `0x…` hex into a byte
  array. No `keccak256`, no signing, no blockchain primitives — just hex
  parsing, which is ~10 lines of plain JS.
- **`tinycolor2`** — used solely to format `{h, s, l}` into an `hsl(H, S%, L%)`
  string. No color picking, no manipulation — just string formatting (with
  one HSL→RGB→HSL roundtrip we replicate exactly).

It also bundles the Svelte runtime to provide a `<zora-zorb>` custom element,
which is great if you want a custom element but pure overhead if you just
want the SVG.

`zero-deps-zorbs` is a re-implementation that strips all of that. The
gradient math and SVG template are ported verbatim from upstream's `lib.ts`
and `zorbImageDataURI.ts` so output matches byte-for-byte; the two
dependencies are replaced inline ([`bytes.ts`](src/bytes.ts),
[`hsl.ts`](src/hsl.ts)). The result is a 3.6 KB bundle with zero
`dependencies` in `package.json`, suitable as a fallback PFP on any site
without dragging in a Svelte runtime or an Ethereum library.

If you want the original web component or you're already inside a Zora app,
use [`@zoralabs/zorb`](https://www.npmjs.com/package/@zoralabs/zorb). If you
want pure functions in a tiny bundle, use this.

## Install

```sh
npm i zero-deps-zorbs
```

## Use

```ts
import { zorbDataURI, zorbSVG, gradientForAddress } from 'zero-deps-zorbs';

// drop into <img>
<img src={zorbDataURI('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')} alt="" />

// or render the SVG inline
element.innerHTML = zorbSVG('0xd8da…');

// or get the raw 5-stop HSL gradient
const [c0, c1, c2, c3, c4] = gradientForAddress('0xd8da…');
```

Inputs are case-insensitive (mirrors `arrayify`'s behaviour). Anything that's
not a `0x`-prefixed even-length hex string throws — same contract as upstream.

## Verification

The whole point of this package is identical output. That promise is
enforced by four independent checks, all run in CI:

| Layer | Command | What it does |
|---|---|---|
| 1. Parity tests | `npm test` | Vitest imports the real `@zoralabs/zorb` and asserts `gradientForAddress`, `zorbDataURI`, and the decoded SVG match across ~2,300 inputs. ~4,800 assertions; any single divergence fails the suite. |
| 2. Parity report | `npm run compare` | Same corpus, but collects every divergence into [`reports/parity-report.md`](reports/parity-report.md). Exits non-zero on any mismatch. |
| 3. Visual report | `npm run build-visual` | Renders 50 upstream-vs-ours pairs side-by-side in [`reports/visual.html`](reports/visual.html) with auto match/DIFFER indicators. |
| 4. Bundle audit | `npm run audit-dist` | Greps `dist/` for `ethers`, `tinycolor`, `keccak`, etc. Fails if any leaked, if size > 5 KB, or if `package.json`'s `dependencies` is non-empty. |

The corpus ([`test/corpus.ts`](test/corpus.ts)) is fully deterministic:
edge addresses (`0x00…00`, `0xff…ff`, alternating-bit patterns), famous
addresses, 2,000 Mulberry32-seeded pseudo-random addresses, and 100
addresses' worth of case variants. Same seed → same corpus → same result
every run.

Run everything end-to-end:

```sh
npm run verify
```

## Credit

The gradient algorithm and the SVG template come from Zora's
[`@zoralabs/zorb`](https://github.com/ourzora/zorb) — MIT licensed,
copyright Zora Labs. This package is a re-implementation, not a fork:
it ships none of the upstream's runtime code, but the mathematical
behaviour is preserved exactly so the output is interchangeable.

If you ship `zero-deps-zorbs`, you're shipping Zora's design and Zora's
algorithm. Please credit them.

## License

MIT.
