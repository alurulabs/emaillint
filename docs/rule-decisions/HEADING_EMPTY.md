# HEADING_EMPTY

**Status:** Resolved — keep as `warning`.
**Rule:** `accessibility` · `warning` · since `0.9.0` · [accessibility/heading-empty.ts](../../packages/core/src/rules/accessibility/heading-empty.ts)

## What it flags

Heading elements (`<h1>`–`<h6>`) with no text content.

## Compat basis

A real accessibility/semantic defect — screen-reader users lose information, or the document's language/structure is undefined.

## Corpus evidence (n=328, 2026-07-27)

- 20 hits / 15 templates (`4.5%` prevalence).

## Decision: keep as `warning`

Genuine a11y defect; keep `warning`. No confirmed-FP class — C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
