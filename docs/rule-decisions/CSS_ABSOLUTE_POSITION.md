# CSS_ABSOLUTE_POSITION

**Status:** Resolved — keep as `warning`.
**Rule:** `compatibility` · `warning` · since `0.1.0` · [compatibility/absolute-position.ts](../../packages/core/src/rules/compatibility/absolute-position.ts)

## What it flags

`position: absolute` declarations.

## Compat basis

No or patchy support across Outlook (Word engine) and Gmail; the layout property is ignored and the element falls back to default flow.

## Corpus evidence (n=328, 2026-07-27)

- 81 hits / 30 templates (`9.0%` prevalence).

## Decision: keep as `warning`

Unsupported layout is a real rendering risk; keep `warning`. No confirmed-FP class — C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
