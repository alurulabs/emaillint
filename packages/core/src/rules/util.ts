import type { EmailRule, Issue, Severity } from "../types/index.js";

interface IssueOptions {
  message: string;
  severity?: Severity;
  line?: number;
  column?: number;
  selector?: string;
  explanation?: string;
  suggestion?: string;
}

export function makeIssue(rule: EmailRule, opts: IssueOptions): Issue {
  return {
    ruleId: rule.id,
    severity: opts.severity ?? rule.severity,
    category: rule.category,
    message: opts.message,
    explanation: opts.explanation,
    selector: opts.selector,
    line: opts.line,
    column: opts.column,
    suggestion: opts.suggestion,
  };
}

// True if a URL/string looks like an external web-font source. Shared by
// CSS_EXTERNAL_FONT (the font authority) and LINK_STYLESHEET (defers font links).
const FONT_URL_RE = /\.woff2?|fonts\.googleapis|fontfamily|font-family|family=|typekit/i;
export function isFontUrl(url: string): boolean {
  return FONT_URL_RE.test(url);
}

// Pull a URL out of a CSS value/param that may be wrapped as url(...), quoted, or bare.
export function extractUrl(raw: string): string {
  const m = raw.match(/url\(\s*['"]?([^'")]+?)['"]?\s*\)/i);
  if (m) return m[1];
  return raw.replace(/^['"]|['"]$/g, "").trim();
}

// Normalize a URL for dedup: extract, drop protocol + leading //, lowercase,
// drop a single trailing slash. Query string is preserved (it carries family=).
export function normalizeUrl(url: string): string {
  let u = extractUrl(url).trim();
  u = u.replace(/^https?:\/\//i, "").replace(/^\/\//, "");
  u = u.toLowerCase();
  if (u.endsWith("/") && u.length > 1) u = u.slice(0, -1);
  return u;
}
