import type { ClientId } from "./generated/compat-data.js";
import { getCompatDataVersion } from "./rules/compat-lookup.js";
import type { EmailContext, Issue } from "./types/index.js";

export const BASELINE_VERSION = 1;
export const FINGERPRINT_VERSION = 1;

// Stable structural attributes only. Volatile presentational/generated attrs
// (class, style, data-*, aria-*, role, tabindex, ...) are excluded so generator
// churn on those does not produce false "new" issues.
const ALLOWLIST = new Set([
  "id", "name", "src", "href", "alt", "width", "height",
  "type", "colspan", "rowspan", "target", "rel", "value",
]);

export interface AnalyzedFile {
  path: string; // repo-relative
  issues: Issue[];
  ctx: EmailContext;
}

export interface BaselineFile {
  version: typeof BASELINE_VERSION;
  fingerprintVersion: typeof FINGERPRINT_VERSION;
  clients?: ClientId[];
  compatDataVersion?: string;
  files: Record<string, Record<string, number>>;
}

export interface NewError {
  path: string;
  fingerprint: string;
  count: number;
  sample: Issue;
}

// Internal: canonical identity for one issue. Element match first, then CSS
// declaration, then ruleId-only. Every fallback degrades gracefully toward a
// coarser but still count-correct identity.
// ponytail: CSS declaration lookup by line:col is ambiguous for multiple inline
// declarations sharing one line; deterministic across runs so baseline matching
// holds, only debuggability of the string suffers. Upgrade path: ladder.
export function fingerprint(ctx: EmailContext, issue: Issue): string {
  // Document-level issues carry no position; skip positional lookup entirely,
  // otherwise undefined === undefined would match auto-inserted elements
  // (head/body) that also lack sourceCodeLocation.
  if (issue.line !== undefined && issue.column !== undefined) {
    const el = ctx.elements.find((e) => e.line === issue.line && e.column === issue.column);
    if (el) {
      const attrs = Object.keys(el.attributes)
        .filter((k) => ALLOWLIST.has(k.toLowerCase()))
        .sort()
        .map((k) => `${k.toLowerCase()}=${el.attributes[k]}`)
        .join("&");
      return `${issue.ruleId}#${el.tagName}#${attrs}`;
    }
    const decl = ctx.cssDeclarations.find((d) => d.line === issue.line && d.column === issue.column);
    if (decl) {
      return `${issue.ruleId}#${decl.selector ?? ""}#${decl.property}#${decl.value}`;
    }
  }
  return `${issue.ruleId}`;
}

// placeholder exports so the module compiles; implemented in later tasks
export function createBaseline(_files: AnalyzedFile[], _opts?: { clients?: ClientId[] }): BaselineFile {
  throw new Error("not implemented");
}
export function diffAgainstBaseline(_files: AnalyzedFile[], _baseline: BaselineFile): { newErrors: NewError[]; suppressed: number } {
  throw new Error("not implemented");
}
export function parseBaseline(_input: unknown): BaselineFile {
  throw new Error("not implemented");
}
