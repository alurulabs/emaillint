# Changelog

Notable changes to EmailLint. The engine is pre-stable (`0.9.0`); rule IDs and
the `analyze()` options shape may change before 1.0.

## [Unreleased]

### Added
- **CLI** - `@emaillint/cli` (bin `emaillint`): lint HTML from the command line
  with `text`/`json` output, per-rule overrides
  (`--rule ID=off|info|warning|error`), and exit code 1 on any `error`-severity
  issue for CI gating.
- **GitHub Action** - composite action (`.github/actions/emaillint`) that runs the
  CLI in CI, plus a dogfood workflow (`.github/workflows/lint.yml`) that lints this
  repo's own example emails.
- Compatibility support matrices are now **derived from a vendored caniemail
  snapshot** (pinned commit) instead of hand-authored. Coverage expanded from 3
  hardcoded clients to ~40 client/platform pairs. `getCompatDataVersion()` returns
  the pinned snapshot; every compatibility finding carries `dataVersion` and
  `lastTested`. Refresh is a dev-only build step (`npm run sync-compat`), keeping
  runtime offline and deterministic.

### Changed
- **Scoring model** - each rule's total penalty is capped at 15, and `info`
  findings no longer penalize (`info = 0`). Fixes score saturation, where one
  prolific rule could floor an otherwise fine email to 0.
- `CSS_BORDER_RADIUS` downgraded `warning` → `info` (cosmetic: unsupported clients
  render harmless square corners).
- `CSS_BACKGROUND_IMAGE` downgraded `warning` → `info` when a VML fallback URL is
  present.

### Fixed
- `CSS_EXTERNAL_FONT` / `LINK_STYLESHEET` double-counted the same font load;
  font-authority dedup removes the duplicate finding.
- `LINK_EMPTY_TEXT` false positive on links whose only content is an image with
  `alt` text.

## [0.9.0] - 2026-07-22

39 rules; tunable severity; structured compatibility metadata.

- `analyze(html, options?)` - optional `rules` map (`"off"` / `"info"` / `"warning"` / `"error"`).
- New `invalid` category (error): `SCRIPT_ELEMENT`, `IFRAME_ELEMENT`, `CANVAS_ELEMENT`, `OBJECT_ELEMENT`, `EMBED_ELEMENT`, `FORM_ELEMENTS`.
- 14 new CSS compatibility rules (grid, fixed/float positioning, transform, transition, animation, filter, backdrop-filter, calc, aspect-ratio, object-fit, mix-blend-mode, min/max/clamp, overflow) with per-client support matrices.
- 4 new accessibility rules: `HTML_MISSING_LANG`, `HTML_MISSING_TITLE`, `LINK_EMPTY_TEXT`, `HEADING_EMPTY`.
- 1 new quality rule: `HTML_MISSING_DOCTYPE`.
- Parser: CSS normalization (property lowercased once), robust inline-style scanner (parens/quotes/comments), columns, doctype, headings, link text.
- `getRule(id)` / `getRules()`; rule metadata (`why`, `howToFix`, `since`, `compatibility`); `KNOWN_CLIENTS` vocabulary; expanded startup `validateRules`.
- Immutable severity overrides (issues are never mutated).

## [0.1.0] - 2026-07-21

Initial engine: 11 rules, `analyze(html)` → `{ score, issues }`.
