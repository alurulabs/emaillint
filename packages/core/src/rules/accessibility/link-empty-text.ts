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
  references: [
    { title: "WCAG 2.4.4 Link Purpose (In Context)", url: "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html", kind: "spec" },
  ],
  check(ctx) {
    return ctx.links
      .filter((l) => !l.text)
      .map((l) => makeIssue(this, { message: "<a> has no text content.", line: l.line, column: l.column }));
  },
};
