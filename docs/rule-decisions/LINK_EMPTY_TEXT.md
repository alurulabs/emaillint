# LINK_EMPTY_TEXT

**Status:** Confirmed — verdict stable (categorical counts below are as of n=78; corpus is now n=328).
**Triage state:** `keep` (warning). Message-quality improvement noted, not a severity change.
**Rule:** `accessibility` · `warning` · since `0.9.0` · [link-empty-text.ts](../../packages/core/src/rules/accessibility/link-empty-text.ts)

## What it flags

Any `<a>` whose accessible text is empty — no text content and no non-empty `<img alt>`.

## Recent fix

`extract.ts` now computes link text via `accessibleText()` (text nodes **+ non-empty img alt**), not text-only `elementText()`. A link whose sole content is a descriptive image (`<a><img alt="Facebook"></a>`) is no longer flagged — matching the rule's own `howToFix` ("an accessible image inside the link"). **Validated at scale:** 213 img-with-alt links across 78 templates, **0 flagged**.

## A11y basis (real — higher stakes than cosmetic rules)

A link with no accessible name is announced by screen readers as the raw href — unusable. WCAG 2.4.4 (Link Purpose) + 4.1.2 (Name, Role, Value). Unlike border-radius (invisible degradation), this is a genuine barrier with a trivial remedy.

## Corpus evidence (n=78)

> Counts below were measured at n=78 (batch-1) and have **not** been refreshed at the current n=328. The verdict does not depend on refreshed counts — it is a principled a11y call (a link with no accessible name is a WCAG 2.4.4 / 4.1.2 barrier with a trivial remedy), not a prevalence-threshold call.

Flagged `<a>` breakdown (121 total flagged):

| Category | Count | Verdict |
|---|---|---|
| `IMG_EMPTY_ALT` (`<a><img alt="">`) | **114** | TP — decorative img = no accessible name |
| `EMPTY` (no img, no text) | 6 | TP — clear defect |
| `IMG_NO_ALT` (img, no alt attr) | 5 | TP — overlaps `IMG_MISSING_ALT` |
| `IMG_WITH_ALT` | 213 | **not flagged** (fix working) ✓ |

The 114 are overwhelmingly **social-icon rows** — `<a><img alt="" src="facebook.png"></a>` repeated per network. Universal email pattern, but each genuinely lacks an accessible name.

## TP vs FP — the call

Post-fix, every remaining flag is a **technically correct TP**: the link has no accessible name. The temptation to treat social-icon rows as "accepted practice" (like border-radius) is weaker here because:
- The degradation is a real a11y barrier (raw href announced), not cosmetic.
- The remedy is trivial and unambiguous: add `alt="Facebook"` to the icon image.
- A tool serious about accessibility should not silently accept nameless links.

So: **not a downgrade candidate.** The noise is the cost of correctness, and the fix is actionable.

## Triage options

| Option | Cost | Effect |
|---|---|---|
| **keep as `warning`** | none | Correct + actionable. Recommended. |
| downgrade to `info` | trivial | Rejected — hides a real, fixable a11y barrier behind cosmetic-flag severity. Also wrongly softens the 6 truly-empty links. |
| **sharpen the message** | low | When the link contains an empty-alt image, say "image link has no alt — add alt text to the image" instead of generic "no text content." Actionable, no severity change. |

## Recommendation

**Keep as `warning`.** All residual flags are correct TPs with trivial fixes; severity matches the a11y stakes. The worthwhile improvement is **message quality** (tell the author *why* — empty-alt image — and *what* to fix), not suppression.

## Empty-alt across rules — resolved (by design, not a gap)

Investigated. `alt=""` is the HTML-spec way to mark a *decorative* image, so `IMG_MISSING_ALT` correctly accepts it (changing that would false-positive on every spacer/decorative img — emails are full of them). Empty-alt *inside a link* is a different concern: the link has no accessible name, so LINK_EMPTY_TEXT correctly fires. Two rules, two correct questions — not an inconsistency.

Verified edge cases: `<img alt="">` → none; `<a><img alt=""></a>` → LINK_EMPTY_TEXT; `<a><img></a>` (no alt) → IMG_MISSING_ALT + LINK_EMPTY_TEXT; `<a><img alt="Home"></a>` → none.

Only nit: `<a><img></a>` double-flags (one missing-alt image = two findings). 5 instances across 78 templates; remedy (add alt) clears both. Accepted — dedup not worth the branching complexity.

## Open questions

- Does the message improvement justify its own change, or wait for a broader message-format pass pre-1.0?
