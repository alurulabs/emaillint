# @emaillint/cli

Lint HTML emails from the command line and in CI. Powered by
[`emaillint-core`](https://www.npmjs.com/package/emaillint-core).

Static analysis: no rendering, no test sends, no network. Finds unsupported or
inconsistently-rendered HTML before you send a campaign.

> The package name `emaillint` is squatted on npm, so this CLI ships as the
> scoped **`@emaillint/cli`** with bin **`emaillint`**.

## Install

```bash
npm install -g @emaillint/cli   # then: emaillint ...
npx @emaillint/cli email.html   # no install
```

## Usage

```bash
emaillint emails/**/*.html
emaillint email.html --format json
emaillint email.html --rule CSS_BORDER_RADIUS=off
emaillint email.html --profile strict          # treat all warnings as errors
emaillint email.html --explain                 # show why + how-to-fix + links under each finding
emaillint --update-baseline .emaillint-baseline.json emails/**/*.html  # snapshot existing errors
emaillint --baseline .emaillint-baseline.json emails/**/*.html         # fail only on NEW errors
```

Multiple glob patterns and individual files are accepted. A literal path that
doesn't exist surfaces as a per-file read error; a glob that matches no files at
all fails with a clear `no files matched` error.

### Options

| Flag | Description |
|---|---|
| `--format <text\|json\|sarif>` | Output format. Default `text`. `json` includes the compatibility `dataVersion` snapshot; `sarif` is for GitHub Code Scanning / Azure. |
| `--rule <ID>=<severity>` | Override a rule severity (`off`, `info`, `warning`, `error`). Repeatable; also `--rule=ID=severity`. Explicit overrides win over `--profile`. |
| `--profile <name>` | Severity policy: `recommended` (default, calibrated), `strict` (warnings -> errors), `relaxed` (warnings -> info). |
| `--explain` | Text only: append `why` / `howToFix` / references under each finding. Default off. No effect on `json` (rules map is always present) or `sarif`. |
| `--preset <name>` | Target a client preset: `outlook`, `gmail`, `apple-mail`, `yahoo`, `all`. Drops compat issues fully supported across the selected clients. |
| `--clients <id,...>` | Target specific caniemail client IDs (see `emaillint clients`). |
| `--baseline <path>` | Fail CI only on errors not in a committed snapshot (adoption for legacy templates). |
| `--update-baseline <path>` | Write/refresh the baseline snapshot. |
| `--help`, `-h` / `--version`, `-v` | Show help / print version. |

Subcommands: `emaillint clients` / `presets` / `profiles` list the caniemail
client IDs, the presets, and the severity profiles.

### Severity profiles & baseline

Two independent knobs that compose:

- **`--profile`** sets severity policy (what counts as an error).
- **`--baseline`** tolerates existing debt (fail only on *new* errors).

`emaillint --profile strict --baseline bl.json emails/**/*.html` = "treat all
warnings as errors, then fail CI only on errors that are new vs the snapshot."
See the [`emaillint-core` docs](https://www.npmjs.com/package/emaillint-core)
for the library API behind both.

### Exit codes

The exit code is **1 if any `error`-severity issue** is found - use it to gate
CI. Under `--baseline`, the gate narrows to **new** errors only (baselined
errors are suppressed). `warning` and `info` never fail the run. No matches /
usage errors also exit non-zero; a missing or invalid baseline exits 2.

## Output

`text` (default) is human-readable; `json` is structured and stable, suitable
for piping into other tools or posting to a dashboard; `sarif` (2.1.0) is for
GitHub Code Scanning and Azure.

The score starts at 100 and decreases per issue: **error −15, warning −5,
info −0**. Each rule is capped at −15, so one prolific rule can't floor the
score on its own. Minimum 0.

## Compatibility data

Support matrices are derived from [caniemail.com](https://www.caniemail.com/) and
baked into `emaillint-core` at build time, so the CLI runs fully offline and
deterministically. See the
[`emaillint-core` docs](https://www.npmjs.com/package/emaillint-core) for the full
rule list, per-client support matrices, and the library API.

## Develop

```
git clone https://github.com/alurulabs/emaillint.git
cd emaillint
npm install
npm run build     # builds core then cli (tsc)
npm test
```

This package is a thin wrapper over `emaillint-core`; see
[GitHub: alurulabs/emaillint](https://github.com/alurulabs/emaillint) for source,
issues, and the engine docs.
