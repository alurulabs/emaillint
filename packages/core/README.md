# EmailLint Core

Deterministic static analysis engine for HTML emails.

Static analysis: no rendering, no test sends, no network. Finds unsupported or
inconsistently-rendered HTML during development, before you send a campaign.

Try it in the browser: **[emaillint.com](https://emaillint.com)** (demo playground).

## Why EmailLint?

Email HTML is not normal HTML. Many CSS features are unsupported or render
inconsistently across Outlook, Gmail, Apple Mail and friends. EmailLint catches
those issues instantly, from the command line and in CI, without rendering emails or
sending test campaigns.

Unlike an HTML validator, EmailLint does not check HTML *correctness*. It checks
email *compatibility*.

## Features

- **Deterministic**: no AI; same input always yields the same output
- **No network requests**: runs fully offline
- **Runs locally**: your HTML never leaves your machine
- **CI friendly**: structured output for automation
- **TypeScript**: fully typed public API
- **Minimal dependencies**: `parse5` + `postcss` only

```ts
import { analyze, getRule, getCompatDataVersion } from "emaillint-core";

const result = analyze(`
  <table><tr><td><img src="logo.png"></td></tr></table>
`);

console.log(result.score);   // 95
console.log(result.issues);  // [{ ruleId: "IMG_MISSING_ALT", severity: "warning", ... }]

// Tunable severity / opt-out (pre-stable shape):
analyze(html, { rules: { CSS_BORDER_RADIUS: "off", BASE64_IMAGE: "warning" } });

// Structured per-rule metadata (support + references derived from caniemail):
getRule("CSS_FLEXBOX")?.compatibility;
// { support: [...~40 client/platform entries...], references: [...],
//   lastTested, dataVersion, alternatives: [...] }
getCompatDataVersion();  // "caniemail@<sha> (<date>)" - pinned data snapshot
```

## Status

**Pre-stable.** Rule IDs and the `analyze()` options shape are pre-stable and may change before 1.0.

Install:

```bash
npm install emaillint-core
```

Or build from source:

```bash
git clone https://github.com/alurulabs/emaillint.git
cd emaillint
npm install
npm run build      # tsc → packages/core/dist
```

## Compatibility data

Support matrices are **derived** from [caniemail.com](https://www.caniemail.com/):
a vendored snapshot (pinned caniemail commit) is baked into the build via
`npm run sync-compat` (`packages/core`); dev-only, so runtime stays offline and
deterministic. Every compatibility finding carries a `dataVersion` (the pinned
commit) and a `lastTested` date; `getCompatDataVersion()` returns the snapshot
version. Hand-typed 3-client matrices are gone. A rule like `CSS_FLEXBOX` now
reports support across ~40 client/platform pairs straight from caniemail.

## CLI (`@emaillint/cli`)

Lint emails from the command line:

```bash
emaillint emails/**/*.html
emaillint email.html --format json
emaillint email.html --rule CSS_BORDER_RADIUS=off
```

Install globally or run one-off:

```bash
npm install -g @emaillint/cli   # then: emaillint ...
npx @emaillint/cli email.html   # no install
```

Exit code is **1 if any `error`-severity issue** (CI gating); warnings/info
don't fail. Output formats: `text` (default) and `json` (includes the
`dataVersion` snapshot). The package name `emaillint` is squatted on npm, so the
CLI ships as the scoped **`@emaillint/cli`** with bin **`emaillint`**.

## Result shape

```ts
interface AnalysisResult {
  score: number;        // 0–100, floor 0
  issues: Issue[];      // ruleId, severity, category, message, line?, column?, suggestion?
}
```

### Score

Score starts at 100 and decreases per issue: **error −15, warning −5, info −0**
(compatibility notes don't penalize). Each rule is capped at −15, so one prolific
rule can't floor the score on its own. Minimum 0.

## Example

Input:

```html
<!DOCTYPE html>
<html lang="en">
<head><title>Demo</title></head>
<body>
  <div style="display:flex"><img src="logo.png"></div>
</body>
</html>
```

Output:

```ts
{
  score: 90,
  issues: [
    {
      ruleId: "CSS_FLEXBOX",
      severity: "warning",
      message: "display:flex is not reliably supported in email clients (especially Outlook).",
      suggestion: "Use table-based layout for email.",
    },
    {
      ruleId: "IMG_MISSING_ALT",
      severity: "warning",
      message: "<img> is missing an alt attribute.",
      suggestion: 'Add alt="" for decorative images or a short text description.',
    },
  ],
}
```

## Rules (39)

**Performance (2)**

| id | severity |
|---|---|
| `HTML_SIZE_EXCEEDED` | warning (>80KB) / error (>102KB) |
| `BASE64_IMAGE` | info |

**Accessibility (5)**

| id | severity |
|---|---|
| `IMG_MISSING_ALT` | warning |
| `HTML_MISSING_LANG` | warning |
| `HTML_MISSING_TITLE` | warning |
| `LINK_EMPTY_TEXT` | warning |
| `HEADING_EMPTY` | warning |

**Quality (3)**

| id | severity |
|---|---|
| `EMPTY_LINK` | warning |
| `DUPLICATE_ID` | warning |
| `HTML_MISSING_DOCTYPE` | warning |

**Compatibility (23): works in some clients**

| id | severity |
|---|---|
| `CSS_FLEXBOX` · `CSS_GRID` | warning |
| `CSS_CUSTOM_PROPERTY` · `CSS_CALC` · `CSS_MIN_MAX_CLAMP` | warning |
| `CSS_BORDER_RADIUS` · `CSS_BACKGROUND_IMAGE` | warning |
| `CSS_ABSOLUTE_POSITION` · `CSS_FIXED_POSITION` · `CSS_FLOAT` | warning |
| `CSS_EXTERNAL_FONT` | warning |
| `CSS_TRANSFORM` · `CSS_FILTER` · `CSS_BACKDROP_FILTER` · `CSS_MIX_BLEND_MODE` | warning |
| `CSS_TRANSITION` · `CSS_ANIMATION` | warning |
| `CSS_ASPECT_RATIO` · `CSS_OBJECT_FIT` · `CSS_OVERFLOW` | warning |
| `VIDEO_ELEMENT` · `AUDIO_ELEMENT` · `LINK_STYLESHEET` | warning |

**Invalid (6): blocked/stripped by all major clients**

| id | severity |
|---|---|
| `SCRIPT_ELEMENT` · `IFRAME_ELEMENT` · `CANVAS_ELEMENT` | error |
| `OBJECT_ELEMENT` · `EMBED_ELEMENT` · `FORM_ELEMENTS` | error |

Each rule carries `why` + `howToFix`; compatibility rules carry a per-client support matrix (`getRule(id).compatibility`).

## Compatibility metadata

Every compatibility rule exposes a per-client support matrix. EmailLint doubles
as a machine-readable email-compatibility database, not just a linter.

```ts
const flexbox = getRule("CSS_FLEXBOX");

flexbox?.compatibility?.support;
// [{ client: "outlook-windows", status: "unsupported", note: "..." },
//  { client: "gmail-web",       status: "partial" },
//  { client: "apple-mail",      status: "supported" }]

flexbox?.compatibility?.references;
// [{ title: "Can I Email", url: "https://www.caniemail.com/...", kind: "official" }]

flexbox?.compatibility?.alternatives;
// ["Table-based layout"]
```

Every rule also carries `why` and `howToFix` strings, so tooling can render
inline guidance without maintaining its own copy.

## Develop

```
npm install
npm test          # vitest
npm run build     # tsc → packages/core/dist
npm run typecheck
```

## Packages

This package (`emaillint-core`) is the analysis engine. Related:

- [`@emaillint/cli`](https://www.npmjs.com/package/@emaillint/cli): the `emaillint` bin; thin wrapper over core
- [GitHub: alurulabs/emaillint](https://github.com/alurulabs/emaillint): monorepo source, issues, docs
