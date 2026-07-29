# CSS_CUSTOM_PROPERTY

**Status:** Resolved — keep as `warning`.
**Rule:** `compatibility` · `warning` · since `0.1.0` · [compatibility/custom-property.ts](../../packages/core/src/rules/compatibility/custom-property.ts)

## What it flags

CSS custom properties (`--*` / `var()`).

## Compat basis

The function/custom-property is unsupported in most clients; the value is silently dropped and the declaration becomes invalid.

## Corpus evidence (n=328, 2026-07-27)

- 3 hits / 1 templates (`0.3%` prevalence).

## Decision: keep as `warning`

Silently-dropped values are a real authoring risk; keep `warning`. No confirmed-FP class — C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
