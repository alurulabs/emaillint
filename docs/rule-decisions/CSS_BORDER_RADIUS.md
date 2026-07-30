# CSS_BORDER_RADIUS

**Status:** Implemented - severity is `info`.
**Triage state:** `downgrade-to-info`.
**Rule:** `compatibility` · `warning` · since `0.1.0` · [border-radius.ts](../../packages/core/src/rules/compatibility/border-radius.ts)

## What it flags

Every `border-radius` CSS declaration. Fires per-declaration.

## Compat basis (real)

Classic Outlook (Word engine) ignores `border-radius` → element renders square. Documented at [caniemail.com/features/css-border-radius](https://www.caniemail.com/features/css-border-radius/). Gmail/Apple Mail support it. The compat fact is **true and worth knowing**.

## Corpus evidence (n=28)

- **200 hits across 25/28 templates (71.4% prevalence)** - the single highest-prevalence rule.
- Fires on every Cerberus template and ~all MJML output (MJML applies `border-radius` to buttons/sections by default).
- Clean baselines (`minimal-clean`, `newsletter-clean`): **0** - rule does not fire on hand-clean HTML.

## FP tension

The fact is real; the **severity** is wrong. `border-radius` is the canonical email "progressive enhancement": rounded in supporting clients, harmlessly square in Outlook. A warning implies a defect. Flagging it on 71% of production templates - including the industry's two reference frameworks - is noise that erodes trust (see Cerberus scoring 40/100, MJML templates 0–30).

A warning that fires on near-universal accepted practice is, in effect, a false alarm even though each individual firing is technically accurate.

## Triage options

| Option | Cost | Effect |
|---|---|---|
| **downgrade `warning` → `info`** | trivial (1 line) | Still surfaces the compat note; stops penalizing score & shouting in annotations. Simplest honest fix. |
| **add heuristic - suppress when Outlook fallback present** | medium | Skip if a VML button / `mso-` fallback is detected nearby. `EmailContext` already extracts `conditionalComments`; plumbing exists, rule not wired. |
| keep as warning | - | Rejected: 71% prevalence = noise. |

## Recommendation

**Downgrade to `info`.** Lowest-risk change that resolves the noise. **Implemented.** Re-evaluate at n≥50: if `info`-level still clutters output on templates that DO carry a VML fallback, escalate to the heuristic (option 2) rather than restoring the warning.

## Open questions

- Does the scoring engine penalize `info` severity? (Confirm before assuming downgrade reduces score distortion - gate C7.)
- Should a VML-fallback heuristic be worth building, or is `info` sufficient? Defer to post-n=50 data.
