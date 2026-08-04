# Changelog

Notable changes to EmailLint. The engine is pre-stable; rule IDs and
the `analyze()` options shape may change before 1.0.

## [Unreleased]

## [0.12.0] - 2026-08-04

### Added
- **Baseline mode** - `--baseline <path>` / `--update-baseline <path>` (CLI) and
  `createBaseline` / `diffAgainstBaseline` / `parseBaseline` (core). CI fails
  only on error-severity issues not present in a committed snapshot, unlocking
  adoption on legacy email codebases. Identity is an allowlist semantic
  fingerprint (`ruleId` + tag + stable attributes, or `ruleId` + CSS
  selector/property/value); the diff is count-based, so it catches duplicate-adds
  a de-duplicating set would mask. `fingerprintVersion` tracks the identity
  algorithm independently of the file schema. Errors only (mirrors `exitCode`);
  client-scope guard fails closed; `compatDataVersion` drift warns. See
  `docs/superpowers/specs/2026-08-03-baseline-mode-design.md`.

### Changed
- **`buildEmailContext` now exported** from `emaillint-core` - the baseline layer
  re-parses each file to fingerprint its issues (the double-parse tradeoff; marked
  `ponytail:` in `run.ts`).

## [0.11.0] - 2026-08-03

Breaking: removes the deprecated `KNOWN_CLIENTS` export and tightens
`ClientStatus.client` from `string` to `ClientId`. First of the pre-1.0
client-vocabulary cleanup; the engine remains pre-stable.

### Removed
- **`KNOWN_CLIENTS`** (#18) - the deprecated hand-maintained client list (`packages/core/src/rules/clients.ts`) and its public export. Its ids (`outlook-com`, `gmail-web`, etc.) were divergent and never matched the generated vocabulary, and the list was never wired to any code path. The public client surface is now `ClientId`, `ClientEntry`, `CLIENTS`, `CLIENT_IDS`, `CLIENT_PRESETS`.

### Changed
- **`ClientStatus.client` typed as `ClientId`** (#18) - was `string`; `ClientId` is now the only client-id type. Sits on a type-only cycle between `types/index.ts` and `generated/compat-data.ts` (both `import type`, erased at runtime).
- **`CLIENT_IDS` sourced from generated `CLIENTS`** (#18) - was a parallel `COMPAT` flatMap derivation; now a single source of truth for the id set.
- Both packages bumped 0.10.0 to 0.11.0; the cli workspace dependency `emaillint-core` moves `^0.10.0` to `^0.11.0`.

## [0.10.0] - 2026-08-02

### Added
- **Client presets + scope-aware filtering** (#13) - `analyze(html, { clients })` drops compat issues fully supported across the selected clients; `--preset` / `--clients` CLI flags plus `clients` / `presets` subcommands; generated `ClientId` union.
- **SARIF 2.1.0 output** (#13) - `--format sarif`, repo-relative paths; GitHub Code Scanning and Azure ready.
- **Generated `CLIENTS` vocabulary** (#14) - id plus a composed `"Family Platform"` label per caniemail client, generated from `_data/nicenames.yml` by `sync-compat`. IDs and labels now share one source of truth with the compat snapshot. `KNOWN_CLIENTS` is `@deprecated` and will be removed in 1.0.

### Changed
- `ClientEntry` type moved from `src/rules/clients.ts` into `src/types/index.ts` so the generated module has a stable type to import.

## [0.9.0] - 2026-07-31

Initial public release: 39 rules, tunable severity, structured compatibility metadata, the `@emaillint/cli`, and the GitHub Action.

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

Engine (39 rules; tunable severity; structured compatibility metadata):

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
