# CSS_BACKGROUND_IMAGE

**Status:** Resolved - keep as `warning`. VML-fallback heuristic implemented 2026-07-27.
**Rule:** `compatibility` · `warning` · since `0.1.0` · [background-image.ts](../../packages/core/src/rules/compatibility/background-image.ts)

## What it flags

`background-image` declarations, and `background` shorthand declarations containing `url()` or `image()`. Solid-color `background` (e.g. `background:red`) does **not** fire - the rule's regex requires `url(`/`image(`.

## Compat basis (real)

Outlook (Word engine) does not render CSS `background-image` without a VML background fallback; several web clients strip it. Documented at [caniemail.com/features/css-background-image](https://www.caniemail.com/features/css-background-image/). Support: `outlook-windows` unsupported, `gmail-web` partial, `apple-mail` supported.

## Corpus evidence (n=78)

- 39 hits across the corpus.

## VML-fallback heuristic (C7, implemented 2026-07-27)

The rule now reads MSO conditional comments for VML background image URLs. When a `background-image` URL exactly matches a VML fallback URL, the finding is **downgraded `warning → info`** (Outlook renders the VML; Apple Mail renders the CSS; only `gmail-web` partial support remains).

The `background-image-vml-fallback` contested fixture asserts the rule still fires when VML is present (recall); the `warning → info` downgrade is asserted in `tests/rules/background-image.test.ts`.

See the `background-image-tp` (TP) and `background-solid-guard` (guard) contested fixtures.

## Decision: keep as `warning`

**Implemented 2026-07-27** (per-image VML-URL match, downgrade-not-suppress).

## Open questions

- Is a VML-background detection heuristic worth building at n≥100, or is `warning` on every `background-image` acceptable? Defer.
