import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

const WARN_BYTES = 80 * 1024;
const ERROR_BYTES = 102 * 1024;

export const htmlSizeRule: EmailRule = {
  id: "HTML_SIZE_EXCEEDED",
  name: "HTML size exceeds email client limits",
  category: "performance",
  severity: "warning",
  description: "Large HTML may be clipped by Gmail (~102KB) and other clients.",
  why: "Gmail clips messages larger than ~102KB, truncating content and breaking open/conversion tracking.",
  howToFix: "Inline only essential CSS, remove unused markup, and minify the HTML to stay below the threshold.",
  since: "0.1.0",
  check(ctx) {
    if (ctx.sizeBytes > ERROR_BYTES) {
      return [
        makeIssue(this, {
          severity: "error",
          message: `HTML size ${ctx.sizeBytes} bytes exceeds the 102KB clipping threshold.`,
          suggestion: "Reduce HTML size below 102KB to avoid Gmail clipping.",
        }),
      ];
    }
    if (ctx.sizeBytes >= WARN_BYTES) {
      return [
        makeIssue(this, {
          severity: "warning",
          message: `HTML size ${ctx.sizeBytes} bytes is large; risk of clipping near 102KB.`,
          suggestion: "Reduce HTML size below 80KB for safety.",
        }),
      ];
    }
    return [];
  },
};
