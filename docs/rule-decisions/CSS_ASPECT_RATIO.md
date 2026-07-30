# CSS_ASPECT_RATIO

**Status:** Resolved - keep as `warning`.
**Rule:** `compatibility` · `warning` · since `0.9.0` · [compatibility/css-rules.ts](../../packages/core/src/rules/compatibility/css-rules.ts)

## What it flags

`aspect-ratio` declarations.

## Compat basis

The function/custom-property is unsupported in most clients; the value is silently dropped and the declaration becomes invalid.

## Corpus evidence (n=328, 2026-07-27)

- 6 hits / 3 templates (`0.9%` prevalence).

## Decision: keep as `warning`

Silently-dropped values are a real authoring risk; keep `warning`. No confirmed-FP class - C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
