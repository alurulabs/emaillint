import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const htmlMissingLangRule: EmailRule = {
  id: "HTML_MISSING_LANG",
  name: "Missing lang attribute",
  category: "accessibility",
  severity: "warning",
  description: "The <html> element has no lang attribute.",
  why: "Without lang, screen readers may use the wrong pronunciation/voice.",
  howToFix: 'Add lang to <html>, e.g. <html lang="en">.',
  references: [
    { title: "WCAG 3.1.1 Language of Page", url: "https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html", kind: "spec" },
  ],
  check(ctx) {
    const html = ctx.elements.find((e) => e.tagName === "html");
    if (html && !html.attributes.lang) {
      return [makeIssue(this, { message: "<html> is missing a lang attribute.", line: html.line, column: html.column })];
    }
    return [];
  },
};
