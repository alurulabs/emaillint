import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const duplicateIdRule: EmailRule = {
  id: "DUPLICATE_ID",
  name: "Duplicate id attribute",
  category: "quality",
  severity: "warning",
  description: "id attributes must be unique within the document.",
  why: "Duplicate id values break in-page anchors, fragment navigation, and label/aria attribute references.",
  howToFix: "Give each element a unique id value.",
  since: "0.1.0",
  check(ctx) {
    const counts = new Map<string, { line?: number; column?: number; count: number }>();
    for (const el of ctx.elements) {
      const id = el.attributes["id"];
      if (!id) continue;
      const existing = counts.get(id);
      if (existing) existing.count += 1;
      else counts.set(id, { line: el.line, column: el.column, count: 1 });
    }
    const issues = [];
    for (const [id, info] of counts) {
      if (info.count > 1) {
        issues.push(
          makeIssue(this, {
            message: `Duplicate id "${id}" found ${info.count} times.`,
            line: info.line,
            column: info.column,
            suggestion: "Make each id unique.",
          }),
        );
      }
    }
    return issues;
  },
};
