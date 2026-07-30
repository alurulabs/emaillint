# CSS_FLOAT

**Status:** Preliminary - pending larger corpus (batch-1 target ~30–50; current n=28).
**Triage state (preliminary):** `keep` - low urgency.
**Rule:** `compatibility` · `warning` · since `0.9.0` · [css-rules.ts](../../packages/core/src/rules/compatibility/css-rules.ts) (`CSS_FLOAT` spec)

## What it flags

Every `float` declaration (except `float: none`). Fires per-declaration.

## Compat basis (real)

Outlook ignores `float`; other clients render it inconsistently. [caniemail.com/features/css-float](https://www.caniemail.com/features/css-float/). Fact is **true**.

## Corpus evidence (n=28)

- **4 hits across 2/28 templates (5.7% prevalence)** - low.
- Both hits are **Cerberus hybrid/responsive**, which uses `float` deliberately as part of its multi-column hybrid layout technique.
- 0 hits on any MJML template, 0 on clean baselines.

## FP tension

Minimal at current prevalence. The n=3 Cerberus-only run made this look prominent (2/3); the 28-template run corrects that - `float` is rare in modern production email (tables dominate). Where it does appear (Cerberus hybrid), the author has chosen it knowingly as a layout primitive, but the warning still carries accurate information for the majority who hit `float` by accident.

## Triage options

| Option | Cost | Effect |
|---|---|---|
| **keep as `warning`** | none | Accurate, low-volume. Documented here so it is not "unknown." |
| downgrade to `info` | trivial | Not justified - volume is already low; a warning on accidental float use is appropriate signal. |
| add heuristic (Cerberus-hybrid float) | high | Not worth it at 5.7% prevalence. |

## Recommendation (preliminary)

**Keep as `warning`.** Record the Cerberus-hybrid exception here for reference. No engine change.

## Open questions

- Does prevalence grow with non-framework real templates (hand-authored, older ESP exports)? Defer to broader corpus.
