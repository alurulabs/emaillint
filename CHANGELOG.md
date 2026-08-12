# Changelog

Notable changes to EmailLint. The engine is pre-stable; rule IDs and the
`analyze()` options shape may change before 1.0.

## [Unreleased]

## [0.14.0] - 2026-08-12

### Added
- Remediation UX: `--explain` flag, JSON `rules` map, SARIF `helpUri` on all rules; `getReferences(rule)` now exported from `emaillint-core`.
- Framework adapters `@emaillint/mjml` and `@emaillint/react-email` (render to HTML, then lint). Workspace-only, not on npm yet.
- `emaillint rules` subcommand: rule catalog as JSON.

### Removed
- `Issue.explanation` (never populated). Use `howToFix`.

## [0.13.0] - 2026-08-06

### Added
- Severity profiles: `--profile <recommended|strict|relaxed>` (CLI) and `analyze(html, { profile })` (core). Shifts severity tiers without adding or removing diagnostics; explicit `--rule` overrides win. `PROFILES` and the profile names are stable public API; composes with `--baseline`.

### Fixed
- CLI bin path `./dist/index.js` -> `dist/index.js`; npm 11 had stripped it, breaking `npx`/global install in 0.12.0. (#24)

## [0.12.0] - 2026-08-04

### Added
- Baseline mode: `--baseline` / `--update-baseline` (CLI) and `createBaseline` / `diffAgainstBaseline` / `parseBaseline` (core). CI fails only on new error-severity issues via a committed semantic-fingerprint snapshot; unlocks legacy-codebase adoption.

### Changed
- `buildEmailContext` now exported from `emaillint-core`.

## [0.11.0] - 2026-08-03

Breaking (pre-1.0): removes deprecated `KNOWN_CLIENTS`; `ClientStatus.client` tightens `string` -> `ClientId`.

### Removed
- `KNOWN_CLIENTS` export (#18) - divergent hand-maintained list, never wired to any code path. Public client surface is now `ClientId`, `ClientEntry`, `CLIENTS`, `CLIENT_IDS`, `CLIENT_PRESETS`.

### Changed
- `ClientStatus.client`: `string` -> `ClientId` (#18).
- `CLIENT_IDS` sourced from generated `CLIENTS` (single source of truth) (#18).

## [0.10.0] - 2026-08-02

### Added
- Client presets + scope-aware filtering (#13): `analyze(html, { clients })` drops compat issues fully supported across selected clients; `--preset` / `--clients` CLI flags plus `clients` / `presets` subcommands; generated `ClientId` union.
- SARIF 2.1.0 output (#13): `--format sarif`, repo-relative paths.
- Generated `CLIENTS` vocabulary (#14): id plus a `"Family Platform"` label per caniemail client, from `sync-compat`. `KNOWN_CLIENTS` `@deprecated` (removed in 0.11.0).

### Changed
- `ClientEntry` type moved into `src/types/index.ts`.

## [0.9.0] - 2026-07-31

Initial public release: 39 rules, tunable severity, structured compatibility metadata, `@emaillint/cli`, GitHub Action.

### Added
- `@emaillint/cli` (bin `emaillint`): `text`/`json` output, per-rule severity overrides (`--rule ID=off|info|warning|error`), exit 1 on any `error`-severity issue for CI gating.
- GitHub Action (`.github/actions/emaillint`) plus a dogfood workflow.
- Compatibility matrices derived from a vendored, pinned caniemail snapshot (~40 client/platform pairs); `getCompatDataVersion()`, per-finding `dataVersion` / `lastTested`; refresh via dev-only `sync-compat` (runtime stays offline and deterministic).
- `analyze(html, options?)` with `rules` map; rule metadata (`why`, `howToFix`, `since`, `compatibility`); `getRule(id)` / `getRules()`; immutable severity overrides.

### Changed
- Scoring: per-rule penalty capped at 15; `info` findings no longer penalize. Fixes saturation where one prolific rule could floor a fine email to 0.
- `CSS_BORDER_RADIUS` `warning` -> `info`; `CSS_BACKGROUND_IMAGE` `warning` -> `info` with a VML fallback.

### Fixed
- `CSS_EXTERNAL_FONT` / `LINK_STYLESHEET` font-load double-count (font-authority dedup).
- `LINK_EMPTY_TEXT` false positive on image-only links with `alt`.

## [0.1.0] - 2026-07-21

Initial engine: 11 rules, `analyze(html)` -> `{ score, issues }`.
