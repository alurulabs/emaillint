import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const flexboxRule: EmailRule = {
  id: "CSS_FLEXBOX",
  name: "Flexbox layout",
  category: "compatibility",
  severity: "warning",
  description: "display:flex is not reliably supported in email clients, especially Outlook.",
  why: "Outlook (Word engine) ignores flexbox, and several web clients render flaky layouts; columns collapse or reorder unexpectedly.",
  howToFix: "Replace flexbox with a table-based layout for email.",
  since: "0.1.0",
  features: ["css-display-flex"],
  alternatives: ["Table-based layout"],
  check(ctx) {
    return ctx.cssDeclarations
      .filter((d) => d.property === "display" && d.value.toLowerCase().includes("flex"))
      .map((d) =>
        makeIssue(this, {
          message: "display:flex is not reliably supported in email clients (especially Outlook).",
          selector: d.selector,
          line: d.line,
          column: d.column,
          suggestion: "Use table-based layout for email.",
        }),
      );
  },
};
