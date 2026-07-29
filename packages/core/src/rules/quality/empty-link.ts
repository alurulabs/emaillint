import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const emptyLinkRule: EmailRule = {
  id: "EMPTY_LINK",
  name: "Empty link",
  category: "quality",
  severity: "warning",
  description: "<a> without an href, or with an empty href, is not navigable.",
  why: "An anchor without a usable href is not navigable and harms accessibility and click tracking.",
  howToFix: "Add a valid href, or replace the anchor with a non-navigable element if it has no destination.",
  since: "0.1.0",
  check(ctx) {
    return ctx.links
      .filter((link) => link.href === undefined || link.href === "")
      .map((link) =>
        makeIssue(this, {
          message: "<a> has no usable href.",
          selector: "a",
          line: link.line,
          column: link.column,
          suggestion: "Add a valid href to the link.",
        }),
      );
  },
};
