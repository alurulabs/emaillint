# IMG_MISSING_ALT

**Status:** Resolved — keep as `warning`.
**Rule:** `accessibility` · `warning` · since `0.1.0` · [accessibility/img-missing-alt.ts](../../packages/core/src/rules/accessibility/img-missing-alt.ts)

## What it flags

`<img>` elements with no `alt` attribute.

## Compat basis

A real accessibility/semantic defect — screen-reader users lose information, or the document's language/structure is undefined.

## Corpus evidence (n=328, 2026-07-27)

- 363 hits / 59 templates (`17.7%` prevalence).

## Decision: keep as `warning`

Genuine a11y defect; keep `warning`. No confirmed-FP class — C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
