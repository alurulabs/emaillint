# EMPTY_LINK

**Status:** Resolved - keep as `warning`.
**Rule:** `quality` · `warning` · since `0.1.0` · [quality/empty-link.ts](../../packages/core/src/rules/quality/empty-link.ts)

## What it flags

`<a>` elements with no usable `href`.

## Compat basis

A structural/semantic correctness issue in the HTML itself.

## Corpus evidence (n=328, 2026-07-27)

- 44 hits / 25 templates (`7.5%` prevalence).

## Decision: keep as `warning`

TP when present; keep `warning`. No confirmed-FP class - C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
