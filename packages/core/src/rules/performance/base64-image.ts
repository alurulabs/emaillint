import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export const base64ImageRule: EmailRule = {
  id: "BASE64_IMAGE",
  name: "Base64-encoded image",
  category: "performance",
  severity: "info",
  description: "data: URIs inline images as base64, increasing size; many clients block them.",
  why: "Base64 data: URIs bloat the HTML and are blocked or stripped by many clients (notably Outlook), so the image does not render.",
  howToFix: "Host the image on a CDN and reference it by URL.",
  since: "0.1.0",
  check(ctx) {
    return ctx.images
      .filter((img) => img.src.toLowerCase().startsWith("data:"))
      .map((img) =>
        makeIssue(this, {
          message: "<img> uses a base64 data: URI.",
          selector: "img",
          line: img.line,
          column: img.column,
          suggestion: "Host the image and reference it by URL where possible.",
        }),
      );
  },
};
