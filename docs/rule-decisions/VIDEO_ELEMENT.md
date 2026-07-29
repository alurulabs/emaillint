# VIDEO_ELEMENT

**Status:** Resolved — keep as `warning`.
**Rule:** `compatibility` · `warning` · since `0.9.0` · [compatibility/element-rules.ts](../../packages/core/src/rules/compatibility/element-rules.ts)

## What it flags

`<video>` elements.

## Compat basis

Stripped or blocked by all major email clients — either for security (`<script>`) or because the embedded media/feature has no email support. Renders nothing or is removed entirely.

## Corpus evidence (n=328, 2026-07-27)

- 1 hits / 1 templates (`0.3%` prevalence).

## Decision: keep as `warning`

These are zero-noise when absent and catch web developers pasting ordinary web patterns into email; keep active. No confirmed-FP class — C3 green (calibration §5).

## Open questions

- Re-check on corpus expansion.
