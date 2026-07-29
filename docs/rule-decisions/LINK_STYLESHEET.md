# LINK_STYLESHEET

**Status:** Resolved — keep as `warning`.
**Rule:** `compatibility` · `warning` · since `0.1.0` · [element-rules.ts](../../packages/core/src/rules/compatibility/element-rules.ts) (`LINK_STYLESHEET` spec)

## What it flags

Any `<link rel="stylesheet">` element. Fires per element.

## Compat basis (real)

Email clients strip or ignore external stylesheets: Gmail removes `<link>` and `@import` entirely; Outlook (Word engine) ignores them. Email CSS is normally inlined, so an external `<link>` is a fragile delivery mechanism. See [CSS_EXTERNAL_FONT.md](./CSS_EXTERNAL_FONT.md) — in this corpus every `<link>` hit loads a web font.

## Corpus evidence (n=78)

- 63 hits — the **identical template set** as `CSS_EXTERNAL_FONT` (63), because each web font is loaded via `<link>` (often alongside an `@import`).

## Coupling with CSS_EXTERNAL_FONT

MJML/Maillage load each web font twice — `<link href="…fonts.googleapis…">` **and** `@import url(…)` — so one font decision surfaces as **2 findings** (`CSS_EXTERNAL_FONT` + `LINK_STYLESHEET`). Both findings were individually true compat notes; the redundancy was a **C7 dedup** problem. **Implemented 2026-07-27:** LINK_STYLESHEET skips `<link>` elements whose `href` is a font URL (`isFontUrl`), so CSS_EXTERNAL_FONT reports the font once. Non-font `<link>` behavior is unchanged.

See the `font-coupling-link-and-import` contested fixture — now a dedup regression guard (`expected: [CSS_EXTERNAL_FONT]`): the former double-fire collapses to one finding.

## Broader scope

`LINK_STYLESHEET` also catches non-font external CSS (rare in email — most CSS is inlined). Those cases are genuinely unsupported and stay `warning`.

## Decision: keep as `warning`

**Implemented 2026-07-27** (font-link skip). LINK_STYLESHEET stays generic for non-font external CSS.

## Open questions

- Does the font-link skip hide any real-world signal at n≥100? Re-check on corpus expansion.
