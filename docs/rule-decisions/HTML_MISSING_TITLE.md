# HTML_MISSING_TITLE

**Status:** Resolved — keep as `warning`.
**Rule:** `accessibility` · `warning` · since `0.9.0` · [accessibility/html-title.ts](../../packages/core/src/rules/accessibility/html-title.ts)

## What it flags

`<head>` with no `<title>`.

## Compat basis

A real accessibility/semantic defect — screen-reader users lose information, or the document's language/structure is undefined.

## Corpus evidence (n=328, 2026-07-27)

- 44 hits / 44 templates (`13.2%` prevalence).

## Decision: keep as `warning`

Genuine a11y defect; keep `warning`. No confirmed-FP class — C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
