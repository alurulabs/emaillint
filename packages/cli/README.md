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
emaillint email.html --rule BASE64_IMAGE=warning
```

Multiple glob patterns and individual files are accepted. A literal path that
doesn't exist surfaces as a per-file read error; a glob that matches no files at
all fails with a clear `no files matched` error.

### Options

| Flag | Description |
|---|---|
| `--format <text\|json>` | Output format. Default `text`. `json` includes the compatibility `dataVersion` snapshot. |
| `--rule <ID>=<severity>` | Override a rule severity (`off`, `info`, `warning`, `error`). Repeatable; also `--rule=ID=severity`. |
| `--help`, `-h` | Show help. |
| `--version`, `-v` | Print version. |

### Exit codes

The exit code is **1 if any `error`-severity issue** is found — use it to gate
CI. `warning` and `info` issues never fail the run. No matches / usage errors
also exit non-zero.

## Output

`text` (default) is human-readable; `json` is structured and stable, suitable
for piping into other tools or posting to a dashboard.

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
