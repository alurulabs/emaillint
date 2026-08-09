import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const htmlMissingDoctypeRule: EmailRule = {
  id: "HTML_MISSING_DOCTYPE",
  name: "Missing or incorrect doctype",
  category: "quality",
  severity: "warning",
  description: "The document is missing <!DOCTYPE html> or uses a non-HTML doctype.",
  why: "Without the HTML5 doctype, clients may fall back to quirks-mode rendering.",
  howToFix: "Start the document with <!DOCTYPE html>.",
  references: [
    { title: "MDN: Doctype", url: "https://developer.mozilla.org/en-US/docs/Glossary/Doctype", kind: "official" },
  ],
  check(ctx) {
    if (!ctx.doctype || ctx.doctype.name !== "html") {
      return [makeIssue(this, { message: "Missing or incorrect <!DOCTYPE html>." })];
    }
    return [];
  },
};
