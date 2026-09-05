# @emaillint/maizzle

Lint [Maizzle](https://maizzle.com) templates with [`emaillint-core`](https://www.npmjs.com/package/emaillint-core).
Renders `.vue` templates to production HTML via `@maizzle/framework`, then runs
emaillint's deterministic analysis on the result.

## Install

```bash
npm install @emaillint/maizzle @maizzle/framework
```

`@maizzle/framework` is a peer dependency; this adapter lints against **your**
installed Maizzle.

## Use

```ts
import { lint } from "@emaillint/maizzle";

const result = await lint("emails/welcome.vue", {
  profile: "strict",                     // optional: emaillint severity profile
  clients: ["outlook-windows"],          // optional: target caniemail clients
  rules: { CSS_BORDER_RADIUS: "off" },   // optional: per-rule overrides
});

console.log(result.score);               // 0-100
console.log(result.issues);              // emaillint-core Issue[]
```

`lint(templatePath, options?)` is the only public function. It calls
`@maizzle/framework`'s `render(templatePath)` - the full pipeline (SSR, Tailwind
compilation, CSS inlining, transformers) - and passes `options` straight through
to emaillint-core's `analyze`. Types (`AnalysisResult`, `AnalyzeOptions`) come
from `emaillint-core`.

**The template must live inside your Maizzle project.** Maizzle compiles CSS from
the stylesheet your template references (typically a `<link rel="stylesheet">`
resolved relative to the template file). A template whose CSS entry does not
resolve silently skips the CSS pipeline, and linting that output would not
reflect what you ship.

Relative paths resolve against the current working directory; absolute paths
work from anywhere.

Each call boots a Vite SSR render (~0.5-1 s per template). That is Maizzle's
cost, not the adapter's.

## Scope

`@emaillint/maizzle` analyzes **rendered HTML only**. There is no CLI, no
SFC-string input (string rendering skips Tailwind/CSS inlining - pass a file
path), and no Maizzle-specific lint rules - the adapter renders, core analyzes.

## Known issue: fresh `@maizzle/framework@6.1.2` install crashes

`postcss-merge-longhand@8.0.4` (a transitive dependency of `@maizzle/framework`)
crashes on first render against `postcss-value-parser@4.2.0`. Until upstream
fixes the publish, pin it for Maizzle only in your `package.json` (a flat
override can break other packages that use v7 of the same plugin):

```json
"overrides": {
  "@maizzle/framework": {
    "postcss-merge-longhand": "8.0.3"
  }
}
```

## Compatibility

| @emaillint/maizzle | emaillint-core | @maizzle/framework | Node   |
| ------------------ | -------------- | ------------------ | ------ |
| 0.1.x              | 0.14.x         | ^6.1.0             | >= 20  |

Pre-1.0: the API may change before 1.0.

## License

MIT

## Develop

This package lives in the
[alurulabs/emaillint](https://github.com/alurulabs/emaillint) monorepo.
