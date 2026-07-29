import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const borderRadiusRule: EmailRule = {
  id: "CSS_BORDER_RADIUS",
  name: "border-radius",
  category: "compatibility",
  severity: "info",
  description: "Classic Outlook does not support border-radius; rounded shapes render square.",
  why: "Outlook (Word engine) ignores border-radius; the element renders with square corners.",
  howToFix: "Provide a square-corner fallback or use a VML button for Outlook.",
  since: "0.1.0",
  features: ["css-border-radius"],
  alternatives: ["VML button"],
  check(ctx) {
    return ctx.cssDeclarations
      .filter((d) => d.property === "border-radius")
      .map((d) =>
        makeIssue(this, {
          message: "border-radius is not supported by classic Outlook (renders square).",
          selector: d.selector,
          line: d.line,
          column: d.column,
          suggestion: "Provide a fallback or accept square corners in Outlook.",
        }),
      );
  },
};
