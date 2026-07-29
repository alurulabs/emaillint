# CSS_OVERFLOW

**Status:** Resolved — keep as `warning`.
**Rule:** `compatibility` · `warning` · since `0.9.0` · [css-rules.ts](../../packages/core/src/rules/compatibility/css-rules.ts) (`CSS_OVERFLOW` spec)

## What it flags

`overflow` / `overflow-x` / `overflow-y` declarations (except `visible`).

## Investigation (n=82)

- 42 declarations across the corpus — **all `overflow: hidden`** (no `auto`/`scroll`).
- **Only 5% (2/42) paired with `border-radius`** on the same element. **95% (40/42) standalone.**

## Verdict: not the border-radius cosmetic family

Earlier hypothesis (that `overflow:hidden` pairs with `border-radius` for rounded-image clipping, and so is the same cosmetic family → candidate for `info`) is **wrong**: 95% of instances are standalone, not clipping pairs.

Standalone `overflow:hidden` has **real Outlook consequences** — content the author intended to clip or hide becomes visible/flows differently (Outlook ignores it entirely). That is a visible rendering difference, unlike `border-radius`'s harmless square corners. It is therefore **more** warning-worthy than border-radius, not less.

## Decision: keep as `warning`

Defensible as-is. The 2 paired-with-border-radius instances (5%) are too few to justify a heuristic or broad downgrade.
