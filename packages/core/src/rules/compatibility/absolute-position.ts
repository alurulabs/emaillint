import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const absolutePositionRule: EmailRule = {
  id: "CSS_ABSOLUTE_POSITION",
  name: "Absolute positioning",
  category: "compatibility",
  severity: "warning",
  description: "position:absolute is not reliably supported in email clients.",
  why: "Absolute positioning is stripped or ignored by Outlook (Word engine) and most webmail clients, so the element reflows to an unexpected location.",
  howToFix: "Use a table-based or inline layout instead of absolute positioning.",
  since: "0.1.0",
  features: ["css-position"],
  alternatives: ["Table-based layout"],
  check(ctx) {
    return ctx.cssDeclarations
      .filter((d) => d.property === "position" && d.value.toLowerCase().trim() === "absolute")
      .map((d) =>
        makeIssue(this, {
          message: "position:absolute is not reliably supported in email clients.",
          selector: d.selector,
          line: d.line,
          column: d.column,
          suggestion: "Use a table-based or inline layout.",
        }),
      );
  },
};
