# @emaillint/react-email

Lint [react-email](https://react.email) templates with [`emaillint-core`](https://www.npmjs.com/package/emaillint-core).
Renders React elements to HTML via `@react-email/render`, then runs emaillint's
deterministic analysis on the result.

## Install

```bash
npm install @emaillint/react-email @react-email/render react react-dom
```

`@react-email/render` and `react` are peer dependencies - this adapter lints
against **your** installed renderer and React.

## Use

```tsx
import { lint } from "@emaillint/react-email";
import { Html, Body, Text } from "@react-email/components";

const Welcome = ({ name }: { name: string }) => (
  <Html>
    <Body>
      <Text>Hi {name}</Text>
    </Body>
  </Html>
);

const result = await lint(<Welcome name="Alex" />, {
  profile: "strict",                     // optional: emaillint severity profile
  clients: ["outlook-windows"],          // optional: target caniemail clients
  rules: { CSS_BORDER_RADIUS: "off" },   // optional: per-rule overrides
});

console.log(result.score);               // 0-100
console.log(result.issues);              // emaillint-core Issue[]
```

`lint(element, options?)` is the only public function. It renders with
`@react-email/render` (default options) and passes `options` straight through to
emaillint-core's `analyze`. Types (`AnalysisResult`, `AnalyzeOptions`) come from
`emaillint-core`.

## Scope

`@emaillint/react-email` analyzes **rendered HTML only**. There is no CLI, no
file-path input (pass a React element), and no react-email-specific lint rules -
the adapter renders, core analyzes.

## Compatibility

| @emaillint/react-email | emaillint-core | @react-email/render | react          | Node   |
| ---------------------- | -------------- | ------------------- | -------------- | ------ |
| 0.1.x                  | 0.13.x         | >= 2.1              | ^18 \|\| ^19  | >= 20  |

Pre-1.0: the API may change before 1.0.

## License

MIT

## Develop

This package lives in the
[alurulabs/emaillint](https://github.com/alurulabs/emaillint) monorepo.
