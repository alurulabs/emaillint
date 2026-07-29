import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const linkEmptyTextRule: EmailRule = {
  id: "LINK_EMPTY_TEXT",
  name: "Empty link text",
  category: "accessibility",
  severity: "warning",
  description: "An <a> element has no text content.",
  why: "Screen readers announce linkless anchors by href, which is unusable.",
  howToFix: "Add descriptive link text or an accessible image inside the link.",
  check(ctx) {
    return ctx.links
      .filter((l) => !l.text)
      .map((l) => makeIssue(this, { message: "<a> has no text content.", line: l.line, column: l.column }));
  },
};
