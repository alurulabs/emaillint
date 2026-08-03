# Contributing to EmailLint

EmailLint is **pre-stable**. Contributions are welcome, but two things
may still change before 1.0:

- **Rule IDs** (`CSS_FLEXBOX`, `IMG_MISSING_ALT`, …) may be renamed.
- **The `analyze()` options shape** may change.

Keep that in mind if you build on top of either. We'll call out breaking changes
in `CHANGELOG.md`.

## Ways to contribute

- **Bug reports** - a real email that EmailLint flags wrong (or misses). Include
  the minimal HTML and the rule ID.
- **New rules** - see below.
- **Compatibility data** - flag where EmailLint disagrees with how a client
  actually renders. Compat data is derived from a pinned [caniemail](https://www.caniemail.com/)
  snapshot; see `packages/core/scripts/sync-compat.ts`.
- **Docs** - clearer wording, better examples, missing rule-decision docs.
- **CLI / Action** - `packages/cli` and `.github/actions/emaillint`.

## Development setup

```bash
git clone https://github.com/alurulabs/emaillint.git
cd emaillint
npm install
npm run build     # tsc → packages/core/dist, packages/cli/dist
npm test          # builds, then runs vitest in every workspace
npm run typecheck
```

The root `package.json` is a workspace root; work happens in `packages/core`
and `packages/cli`. See the README's **Develop** and **Packages** sections.

## Adding a rule

Mirror an **existing** rule rather than inventing structure - the codebase is
the source of truth. Roughly:

1. Pick the category folder under `packages/core/src/rules/`
   (`accessibility/`, `compatibility/`, `performance/`, `quality/`).
2. Implement the rule following the pattern of a neighbour (same exports, same
   `why` / `howToFix` strings; compatibility rules derive support from the
   caniemail snapshot).
3. Register it in the `rules` array in `packages/core/src/rules/index.ts`. CSS
   and element compatibility rules are aggregated from specs in
   `compatibility/css-rules.ts` and `compatibility/element-rules.ts` instead -
   their per-client support is derived automatically, so don't set it by hand.
4. Add a rule-decision doc: `docs/rule-decisions/<RULE_ID>.md` - every current
   rule has one; match their shape.
5. Add tests under `packages/core/tests/`.

## Compatibility rules specifically

Support matrices are **derived**, not hand-typed. Don't write a literal
3-client matrix - let the derivation from the pinned caniemail snapshot produce
it. If you believe a derivation is wrong, open an issue describing the email
and the client that renders differently.

## Commit style

This repo uses **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`,
…). Keep the subject short and imperative.

## Before you open a PR

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (build + tests across workspaces)
- [ ] New rule → has a `docs/rule-decisions/<ID>.md` doc and tests
- [ ] Commit messages follow Conventional Commits

Open the PR against `main`.
