# BASE64_IMAGE

**Status:** Resolved - keep as `warning`.
**Rule:** `performance` · `warning` · since `0.1.0` · [performance/base64-image.ts](../../packages/core/src/rules/performance/base64-image.ts)

## What it flags

`<img src="data:…">` base64-encoded images.

## Compat basis

A deliverability or weight cost that harms rendering or triggers client clipping.

## Corpus evidence (n=328, 2026-07-27)

- 0 hits on the 328-template corpus (zero-hit). The pattern is rare in competent email, not wrong - this rule catches the web-developer mistake the one time it occurs.

## Decision: keep as `warning`

Real cost; keep `warning`. No confirmed-FP class - C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
