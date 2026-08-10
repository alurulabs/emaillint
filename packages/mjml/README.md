# @emaillint/mjml

Lint MJML source with [`emaillint-core`](https://www.npmjs.com/package/emaillint-core).
Renders MJML to HTML, then runs emaillint's deterministic analysis on the result.

## Install

```bash
npm install @emaillint/mjml mjml
```

`mjml` is a peer dependency - this adapter lints against **your** installed MJML.

## Use

```js
import { lint } from "@emaillint/mjml";

const result = await lint(mjmlSource, {
  profile: "strict",                     // optional: emaillint severity profile
  clients: ["outlook-windows"],          // optional: target caniemail clients
  rules: { CSS_BORDER_RADIUS: "off" },   // optional: per-rule overrides
});

console.log(result.score);               // 0-100
console.log(result.issues);              // emaillint-core Issue[]
```

`lint(source, options?)` is the only public function. It renders with
`validationLevel: "skip"` and passes `options` straight through to emaillint-core's
`analyze`. Types (`AnalysisResult`, `AnalyzeOptions`) come from `emaillint-core`.

## Scope

`@emaillint/mjml` analyzes **rendered HTML only**. MJML source validation is
outside this adapter's scope (use MJML's own linter for that). There is no CLI,
no file-path input (pass a source string), and no MJML-specific lint rules - the
adapter renders, core analyzes.

## Compatibility

| Package | Version |
|---|---|
| `@emaillint/mjml` | 0.1.x |
| `emaillint-core` | 0.13.x |
| `mjml` | 5.x |
| Node | >= 20 |

Pre-1.0: the API may change before 1.0.

## Develop

This package lives in the
[alurulabs/emaillint](https://github.com/alurulabs/emaillint) monorepo.
