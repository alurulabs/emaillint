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
// holds, only debuggability of the string suffers. Id selectors contain "#"
// (e.g. div#main), colliding with the "#" joiner - same fail-safe direction as
// the "&"-in-value collision (false collision = masked duplicate = false
// negative). Upgrade path: ladder.
export function fingerprint(ctx: EmailContext, issue: Issue): string {
  // Document-level issues carry no position; skip positional lookup entirely,
  // otherwise undefined === undefined would match auto-inserted elements
  // (head/body) that also lack sourceCodeLocation.
  if (issue.line !== undefined && issue.column !== undefined) {
    const el = ctx.elements.find((e) => e.line === issue.line && e.column === issue.column);
    if (el) {
      const attrs = Object.keys(el.attributes)
        .filter((k) => ALLOWLIST.has(k.toLowerCase()))
        .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0))
        .map((k) => `${k.toLowerCase()}=${el.attributes[k]}`)
        .join("&");
      return `${issue.ruleId}#${el.tagName.toLowerCase()}#${attrs}`;
    }
    const decl = ctx.cssDeclarations.find((d) => d.line === issue.line && d.column === issue.column);
    if (decl) {
      return `${issue.ruleId}#${decl.selector ?? ""}#${decl.property}#${decl.value}`;
    }
  }
  return `${issue.ruleId}`;
}

export function createBaseline(files: AnalyzedFile[], opts?: { clients?: ClientId[] }): BaselineFile {
  const out: BaselineFile = {
    version: BASELINE_VERSION,
    fingerprintVersion: FINGERPRINT_VERSION,
    compatDataVersion: getCompatDataVersion(),
    files: {},
  };
  if (opts?.clients?.length) out.clients = [...opts.clients].sort();
  const paths = [...files].sort((x, y) => (x.path < y.path ? -1 : x.path > y.path ? 1 : 0));
  for (const f of paths) {
    const counts = new Map<string, number>();
    for (const is of f.issues) {
      if (is.severity !== "error") continue;
      const fp = fingerprint(f.ctx, is);
      counts.set(fp, (counts.get(fp) ?? 0) + 1);
    }
    if (counts.size === 0) continue;
    const sorted: Record<string, number> = {};
    for (const fp of [...counts.keys()].sort()) sorted[fp] = counts.get(fp)!;
    out.files[f.path] = sorted;
  }
  return out;
}
export function diffAgainstBaseline(
  files: AnalyzedFile[],
  baseline: BaselineFile,
): { newErrors: NewError[]; suppressed: number } {
  const newErrors: NewError[] = [];
  let suppressed = 0;
  for (const f of files) {
    const base = baseline.files[f.path] ?? {};
    const cur = new Map<string, { count: number; sample: Issue }>();
    for (const is of f.issues) {
      if (is.severity !== "error") continue;
      const fp = fingerprint(f.ctx, is);
      const ex = cur.get(fp);
      if (ex) ex.count++;
      else cur.set(fp, { count: 1, sample: is });
    }
    for (const [fp, { count, sample }] of cur) {
      const baseCount = base[fp] ?? 0;
      if (count > baseCount) newErrors.push({ path: f.path, fingerprint: fp, count: count - baseCount, sample });
      suppressed += Math.min(count, baseCount);
    }
  }
  return { newErrors, suppressed };
}
export function parseBaseline(input: unknown): BaselineFile {
  if (typeof input !== "object" || input === null) throw new Error("Invalid baseline: not an object");
  const o = input as Record<string, unknown>;
  if (o.version !== BASELINE_VERSION) throw new Error(`Unsupported baseline version ${o.version}. Regenerate with --update-baseline.`);
  if (o.fingerprintVersion !== FINGERPRINT_VERSION) throw new Error(`Unsupported baseline fingerprintVersion ${o.fingerprintVersion}. Regenerate with --update-baseline.`);
  if (typeof o.files !== "object" || o.files === null) throw new Error("Invalid baseline: missing files");
  for (const [path, entries] of Object.entries(o.files as Record<string, unknown>)) {
    if (typeof entries !== "object" || entries === null) throw new Error(`Invalid baseline: files["${path}"] is not an object`);
    for (const [fp, c] of Object.entries(entries as Record<string, unknown>)) {
      if (typeof c !== "number" || !Number.isInteger(c) || c < 0) throw new Error(`Invalid baseline: files["${path}"]["${fp}"] is not a non-negative integer`);
    }
  }
  const out: BaselineFile = {
    version: BASELINE_VERSION,
    fingerprintVersion: FINGERPRINT_VERSION,
    files: o.files as Record<string, Record<string, number>>,
  };
  if (o.clients !== undefined) {
    if (!Array.isArray(o.clients) || !o.clients.every((c) => typeof c === "string")) {
      throw new Error("Invalid baseline: clients must be an array of strings");
    }
    out.clients = o.clients as ClientId[];
  }
  if (typeof o.compatDataVersion === "string") out.compatDataVersion = o.compatDataVersion;
  return out;
}
