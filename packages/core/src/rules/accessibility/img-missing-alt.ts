import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const imgMissingAltRule: EmailRule = {
  id: "IMG_MISSING_ALT",
  name: "Image missing alt text",
  category: "accessibility",
  severity: "warning",
  description: "Every <img> must have an alt attribute (empty alt allowed for decorative images).",
  why: "Images without an alt attribute are invisible to screen readers and show nothing meaningful when images are blocked by the client.",
  howToFix: 'Add alt="" for decorative images, or a short descriptive text otherwise.',
  references: [
    { title: "WCAG 1.1.1 Non-text Content", url: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html", kind: "spec" },
  ],
  since: "0.1.0",
  check(ctx) {
    return ctx.images
      .filter((img) => img.alt === undefined)
      .map((img) =>
        makeIssue(this, {
          message: "<img> is missing an alt attribute.",
          selector: "img",
          line: img.line,
          column: img.column,
          suggestion: 'Add alt="" for decorative images or a short text description.',
        }),
      );
  },
};
