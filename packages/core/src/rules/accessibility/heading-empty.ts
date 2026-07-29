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
  check(ctx) {
    return ctx.headings
      .filter((h) => !h.text)
      .map((h) => makeIssue(this, { message: `<h${h.level}> is empty.`, line: h.line, column: h.column }));
  },
};
