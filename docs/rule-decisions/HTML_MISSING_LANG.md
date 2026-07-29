# HTML_MISSING_LANG

**Status:** Resolved — keep as `warning`.
**Rule:** `accessibility` · `warning` · since `0.9.0` · [accessibility/html-lang.ts](../../packages/core/src/rules/accessibility/html-lang.ts)

## What it flags

`<html>` with no `lang` attribute.

## Compat basis

A real accessibility/semantic defect — screen-reader users lose information, or the document's language/structure is undefined.

## Corpus evidence (n=328, 2026-07-27)

- 127 hits / 127 templates (`38.1%` prevalence).

## Decision: keep as `warning`

Genuine a11y defect; keep `warning`. No confirmed-FP class — C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
