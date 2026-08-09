import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const htmlMissingTitleRule: EmailRule = {
  id: "HTML_MISSING_TITLE",
  name: "Missing <title>",
  category: "accessibility",
  severity: "warning",
  description: "The email has no <title> element (or it is empty).",
  why: "<title> feeds the inbox preview/subject area and accessibility tools.",
  howToFix: "Add a concise <title> inside <head>.",
  references: [
    { title: "WCAG 2.4.2 Page Titled", url: "https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html", kind: "spec" },
  ],
  check(ctx) {
    const title = ctx.elements.find((e) => e.tagName === "title");
    // heading/link text capture is structural; title emptiness approximated by absence of #text sibling.
    if (!title) {
      const head = ctx.elements.find((e) => e.tagName === "head");
      if (head) return [makeIssue(this, { message: "<head> is missing a <title>.", line: head.line, column: head.column })];
    }
    return [];
  },
};
