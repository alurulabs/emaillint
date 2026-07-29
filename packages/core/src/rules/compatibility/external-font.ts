import type { EmailRule } from "../../types/index.js";
import { makeIssue, isFontUrl, normalizeUrl } from "../util.js";

export const externalFontRule: EmailRule = {
  id: "CSS_EXTERNAL_FONT",
  name: "External web font",
  category: "compatibility",
  severity: "warning",
  description: "@font-face and external font imports have limited support in email clients.",
  why: "Most email clients block or ignore @font-face and external font imports, so the custom font never loads and the text falls back to a system font.",
  howToFix: "Use a web-safe font stack and reserve custom fonts for progressive enhancement.",
  since: "0.1.0",
  features: ["css-at-import", "css-at-font-face"],
  alternatives: ["Web-safe font stack"],
  check(ctx) {
    const issues = [];
    const seen = new Set<string>();

    // @font-face: self-hosted source, one finding each (not URL-deduped against links/imports).
    // @import of a font URL: deduped by URL against <link> font hrefs below.
    for (const at of ctx.cssAtRules) {
      const name = at.name.toLowerCase();
      if (name === "font-face") {
        issues.push(
          makeIssue(this, {
            message: `External font (@font-face) has limited email client support.`,
            line: at.line,
            column: at.column,
            suggestion: "Use a web-safe font stack for email.",
          }),
        );
      } else if (name === "import" && isFontUrl(at.params)) {
        const key = normalizeUrl(at.params);
        if (seen.has(key)) continue;
        seen.add(key);
        issues.push(
          makeIssue(this, {
            message: `External font (@import) has limited email client support.`,
            line: at.line,
            column: at.column,
            suggestion: "Use a web-safe font stack for email.",
          }),
        );
      }
    }

    // Font <link> hrefs: CSS_EXTERNAL_FONT owns these so they are not double-counted
    // by LINK_STYLESHEET. Deduped against @import by URL.
    for (const el of ctx.elements) {
      if (el.tagName !== "link") continue;
      const rel = (el.attributes.rel ?? "").toLowerCase();
      if (!rel.includes("stylesheet")) continue;
      const href = el.attributes.href ?? "";
      if (!isFontUrl(href)) continue;
      const key = normalizeUrl(href);
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push(
        makeIssue(this, {
          message: `External font (<link>) has limited email client support.`,
          line: el.line,
          column: el.column,
          suggestion: "Use a web-safe font stack for email.",
        }),
      );
    }

    return issues;
  },
};
