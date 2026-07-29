# CSS_MIX_BLEND_MODE

**Status:** Resolved — keep as `warning`.
**Rule:** `compatibility` · `warning` · since `0.9.0` · [compatibility/css-rules.ts](../../packages/core/src/rules/compatibility/css-rules.ts)

## What it flags

`mix-blend-mode` declarations.

## Compat basis

Ignored or inconsistently supported across clients; the effect degrades silently (no visible failure, just no effect).

## Corpus evidence (n=328, 2026-07-27)

- 7 hits / 3 templates (`0.9%` prevalence).

## Decision: keep as `warning`

Visual-only, silently degrades; keep `warning`. No confirmed-FP class — C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
