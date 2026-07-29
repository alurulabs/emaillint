import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const customPropertyRule: EmailRule = {
  id: "CSS_CUSTOM_PROPERTY",
  name: "CSS custom property (variable)",
  category: "compatibility",
  severity: "warning",
  description: "var(--…) is not supported by many email clients.",
  why: "CSS custom properties and var() references are stripped or unresolved in Outlook and several web clients, so the value (and the cascade that depends on it) is dropped.",
  howToFix: "Resolve custom properties to literal values before sending.",
  since: "0.1.0",
  features: ["css-variables"],
  alternatives: ["Literal CSS values"],
  check(ctx) {
    return ctx.cssDeclarations
      .filter((d) => /var\(--/i.test(d.value))
      .map((d) =>
        makeIssue(this, {
          message: "CSS custom property var(--…) is not widely supported in email clients.",
          selector: d.selector,
          line: d.line,
          column: d.column,
          suggestion: "Replace with a literal value.",
        }),
      );
  },
};
