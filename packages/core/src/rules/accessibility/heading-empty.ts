import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const headingEmptyRule: EmailRule = {
  id: "HEADING_EMPTY",
  name: "Empty heading",
  category: "accessibility",
  severity: "warning",
  description: "A heading element (<h1>-<h6>) has no text content.",
  why: "Empty headings confuse screen-reader heading navigation.",
  howToFix: "Add text or remove the empty heading.",
  references: [
    { title: "WCAG 2.4.6 Headings and Labels", url: "https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html", kind: "spec" },
  ],
  check(ctx) {
    return ctx.headings
      .filter((h) => !h.text)
      .map((h) => makeIssue(this, { message: `<h${h.level}> is empty.`, line: h.line, column: h.column }));
  },
};
