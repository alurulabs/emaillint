# HTML_SIZE_EXCEEDED

**Status:** Resolved - keep as `warning`.
**Rule:** `performance` · `warning` · since `0.1.0` · [performance/html-size.ts](../../packages/core/src/rules/performance/html-size.ts)

## What it flags

HTML exceeding the size threshold (clipping risk).

## Compat basis

A deliverability or weight cost that harms rendering or triggers client clipping.

## Corpus evidence (n=328, 2026-07-27)

- 42 hits / 42 templates (`12.6%` prevalence).

## Decision: keep as `warning`

Real cost; keep `warning`. No confirmed-FP class - C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
