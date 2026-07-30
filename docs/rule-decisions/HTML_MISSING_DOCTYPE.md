# HTML_MISSING_DOCTYPE

**Status:** Resolved - keep as `warning`.
**Rule:** `quality` · `warning` · since `0.9.0` · [quality/html-doctype.ts](../../packages/core/src/rules/quality/html-doctype.ts)

## What it flags

Missing `<!DOCTYPE>` declaration.

## Compat basis

A structural/semantic correctness issue in the HTML itself.

## Corpus evidence (n=328, 2026-07-27)

- 7 hits / 7 templates (`2.1%` prevalence).

## Decision: keep as `warning`

TP when present; keep `warning`. No confirmed-FP class - C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
