# FORM_ELEMENTS

**Status:** Resolved — keep as `error`.
**Rule:** `invalid` · `error` · since `0.9.0` · [compatibility/element-rules.ts](../../packages/core/src/rules/compatibility/element-rules.ts)

## What it flags

`<form>`, `<input>`, `<select>`, `<textarea>`, `<button>`.

## Compat basis

Forms do not function in email — clients strip or render them inert; no submission is possible.

## Corpus evidence (n=328, 2026-07-27)

- 44 hits / 9 templates (`2.7%` prevalence).

## Decision: keep as `error`

Non-functional in email; keep `error`. No confirmed-FP class — C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
