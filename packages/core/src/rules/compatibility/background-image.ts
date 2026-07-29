import type { EmailRule } from "../../types/index.js";
import { makeIssue, normalizeUrl } from "../util.js";

export const backgroundImageRule: EmailRule = {
  id: "CSS_BACKGROUND_IMAGE",
  name: "background-image",
  category: "compatibility",
  severity: "warning",
  description: "CSS background-image is poorly supported in Outlook and some web clients.",
  why: "Outlook (Word engine) does not render CSS background-image without a VML fallback, and several web clients strip it, so the image never appears.",
  howToFix: "Use an <img> element, or add a VML background fallback for Outlook.",
  since: "0.1.0",
  features: ["css-background-image"],
  alternatives: ["<img> element", "VML background"],
  check(ctx) {
    // Collect VML background image URLs from MSO conditional comments (Outlook fallbacks).
    const vmlImages = new Set<string>();
    const srcRe = /(?:src|background)\s*=\s*["']([^"']+)["']/gi;
    for (const cc of ctx.conditionalComments) {
      let m = srcRe.exec(cc.content);
      while (m !== null) {
        vmlImages.add(normalizeUrl(m[1]));
        m = srcRe.exec(cc.content);
      }
    }

    return ctx.cssDeclarations
      .filter((d) => {
        if (d.property === "background-image") return true;
        if (d.property === "background") return /url\(|image\(/i.test(d.value);
        return false;
      })
      .map((d) => {
        const urlMatch = d.value.match(/url\(\s*['"]?([^'")]+?)['"]?\s*\)/i);
        const hasVml = urlMatch ? vmlImages.has(normalizeUrl(urlMatch[1])) : false;
        return makeIssue(this, {
          severity: hasVml ? "info" : undefined,
          message: hasVml
            ? "CSS background-image has a VML fallback for Outlook; other clients may still strip it."
            : "CSS background-image has unreliable support in email clients.",
          selector: d.selector,
          line: d.line,
          column: d.column,
          suggestion: hasVml
            ? "VML covers Outlook; verify rendering in Gmail."
            : "Use an <img> or VML fallback for Outlook.",
        });
      });
  },
};
