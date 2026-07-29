# CSS_EXTERNAL_FONT (+ LINK_STYLESHEET coupling)

**Status:** Preliminary — pending larger corpus (batch-1 target ~30–50; current n=28).
**Triage state:** `keep` (warning defensible). Dedup **implemented 2026-07-27** — CSS_EXTERNAL_FONT is now the single font authority.
**Rules:** `CSS_EXTERNAL_FONT` (`warning`, since `0.1.0`, [external-font.ts](../../packages/core/src/rules/compatibility/external-font.ts)) co-fires with `LINK_STYLESHEET` (`warning`, [element-rules.ts](../../packages/core/src/rules/compatibility/element-rules.ts)).

## What they flag

- `CSS_EXTERNAL_FONT` — `@font-face`, font-related `@import`, and font `<link rel="stylesheet" href=…>` hrefs (shared `isFontUrl` regex: `fonts.googleapis`, `family=`, `fontfamily`, `.woff`, typekit).
- `LINK_STYLESHEET` — any `<link rel="stylesheet">` (broader than fonts, but in this corpus every hit is a web font).

## Compat basis (real — stronger than border-radius)

Web fonts have **low** email support: Outlook ignores `@font-face`; Gmail strips `<link>`/`@import`; only Apple Mail/iOS render them. [caniemail.com/features/css-font-face](https://www.caniemail.com/features/css-font-face/). Both rules' support matrices agree: `outlook-windows` + `gmail-web` = unsupported, `apple-mail` = partial. The concern is legitimate — text falls back to a system font in the two largest clients.

## Corpus evidence (n=28)

- `CSS_EXTERNAL_FONT`: 21 hits / 17 templates (48.6%).
- `LINK_STYLESHEET`: 21 hits / 17 templates (48.6%) — **identical template set**.
- MJML emits **both** per web font:
  ```html
  <link href="https://fonts.googleapis.com/css?family=Source+Sans+3" rel="stylesheet">
  ...
  @import url(https://fonts.googleapis.com/css?family=Source+Sans+3);
  ```
  → one font decision = **2 issues**. ~21 distinct fonts surface as 42 issues.

## FP tension — weaker than border-radius

border-radius was a clear downgrade (high support, harmless degradation). Web fonts are different:
- Support is **low** (2 of 3 tracked clients unsupported) — visible degradation (wrong font) vs border-radius's invisible one (square corners).
- `warning` is therefore defensible. A user shipping a web font *should* know it won't render for most recipients.
- Accepted practice (MJML/Maillage all do it) does not make it risk-free — it is deliberate progressive enhancement, exactly what `howToFix` already advises ("reserve custom fonts for progressive enhancement").

## The real noise: double-counting, not severity

The inflated prevalence is structural: `<link>` + `@import` for the same URL = 2 findings for 1 decision. That is redundant signal, not two problems.

## Triage options

| Option | Cost | Effect |
|---|---|---|
| **keep both as `warning`** | none | Accurate, low-support feature. Recommended baseline. |
| downgrade either to `info` | trivial | Rejected — support too low to treat as a harmless note. |
| **dedup: link + import of same URL → 1 finding** | implemented 2026-07-27 | Halves the noise (42→~21) without weakening signal. Turned out to be a one-rule change: CSS_EXTERNAL_FONT reads both `cssAtRules` and `elements`, so no engine work was needed. |

## Recommendation (preliminary)

**Implemented 2026-07-27.** CSS_EXTERNAL_FONT now reads `@import`/`@font-face` **and** font `<link>` hrefs, emitting one finding per font URL (the `<link>`+`@import` double-fire is deduped). LINK_STYLESHEET skips font-hrefs via the shared `isFontUrl` helper. The `font-coupling-link-and-import` contested fixture now expects `[CSS_EXTERNAL_FONT]`.

## LINK_STYLESHEET broader scope

`LINK_STYLESHEET` also catches non-font external CSS (rare in email — most CSS is inlined). Those cases are genuinely unsupported and stay `warning`. This doc covers the font-coupling case; non-font usage defaults to "keep."

## Open questions

- Does the link+import dedup hide any real-world signal at n≥50? Re-check on corpus expansion.
- Do non-framework real templates load fonts via `<link>` only (single-fire)? Broader corpus will tell.
