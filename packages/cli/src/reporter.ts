// packages/cli/src/reporter.ts
import type { RunResult, Format, FileResult, BaselineOutcome } from "./types.js";
import { relative, isAbsolute } from "node:path";
import { getCompatDataVersion, getRules, getRule, getReferences } from "emaillint-core";
import { VERSION } from "./version.js";
const REPO_URL = "https://github.com/alurulabs/emaillint";

export function format(rr: RunResult, fmt: Format, explain = false): string {
  const sorted: FileResult[] = [...rr.results].sort((x, y) => (x.path < y.path ? -1 : x.path > y.path ? 1 : 0));
  if (fmt === "json") return toJson(sorted, rr.clients, rr.baseline);
  if (fmt === "sarif") return toSarif(sorted, rr.clients, rr.baseline);
  return toText(sorted, rr.baseline, explain);
}

function explainLines(ruleId: string): string[] {
  const rule = getRule(ruleId);
  if (!rule) return [];
  const refs = getReferences(rule);
  const lines = [`  why:  ${rule.why}`, `  fix:  ${rule.howToFix}`];
  refs.forEach((ref, i) => {
    lines.push(`${i === 0 ? "  see:  " : "        "}${ref.title} (${ref.url})`);
  });
  return lines;
}

function toText(results: FileResult[], baseline?: BaselineOutcome, explain = false): string {
  const lines: string[] = [];
  if (baseline?.mode === "check") {
    for (const f of results) {
      if ("readError" in f) lines.push(`${f.path}:  error: ${f.readError}`);
    }
    for (const ne of baseline.newErrors) {
      const s = ne.sample;
      const loc = s.line ? `${s.line}:${s.column ?? 1}  ` : "";
      const xn = ne.count > 1 ? `  x${ne.count}` : "";
      lines.push(`${ne.path}:${loc}${s.ruleId}  new  ${s.message}${xn}  (example location)`);
      if (explain) lines.push(...explainLines(s.ruleId));
    }
    lines.push(`${baseline.newErrors.length} new error(s); ${baseline.suppressed} known (suppressed)`);
    if (baseline.compatWarning) lines.push(`warning: ${baseline.compatWarning}`);
    return lines.join("\n");
  }
  let errors = 0, warnings = 0, info = 0;
  for (const f of results) {
    if ("readError" in f) { lines.push(`${f.path}:  error: ${f.readError}`); errors++; continue; }
    for (const is of f.result.issues) {
      if (is.severity === "error") errors++;
      else if (is.severity === "warning") warnings++;
      else info++;
      const loc = is.line ? `${is.line}:${is.column ?? 1}  ` : "";
      lines.push(`${f.path}:${loc}${is.ruleId}  ${is.severity}  ${is.message}`);
      if (explain) lines.push(...explainLines(is.ruleId));
    }
  }
  const total = errors + warnings + info;
  lines.push(`${results.length} files, ${total} issues (${errors} errors, ${warnings} warnings, ${info} info)`);
  return lines.join("\n");
}

function toJson(results: FileResult[], clients?: string[], baseline?: BaselineOutcome): string {
  let errors = 0, warnings = 0, info = 0;
  const files = results.map((f) => {
    if ("readError" in f) { errors++; return { path: f.path, error: f.readError }; }
    for (const is of f.result.issues) {
      if (is.severity === "error") errors++;
      else if (is.severity === "warning") warnings++;
      else info++;
    }
    return { path: f.path, score: f.result.score, issues: f.result.issues };
  });
  const payload: Record<string, unknown> = {
    dataVersion: getCompatDataVersion(),
    files,
    totals: { files: results.length, errors, warnings, info },
  };
  if (clients && clients.length) payload.clients = clients;
  if (baseline) {
    payload.baseline = {
      mode: baseline.mode,
      newErrors: baseline.newErrors,
      suppressed: baseline.suppressed,
      ...(baseline.compatWarning ? { compatWarning: baseline.compatWarning } : {}),
      ...(baseline.writtenPath ? { writtenPath: baseline.writtenPath } : {}),
    };
  }
  return JSON.stringify(payload, null, 2);
}

const LEVEL_MAP: Record<string, "error" | "warning" | "note"> = {
  error: "error",
  warning: "warning",
  info: "note",
};

// Note: when `p` is outside `base`, `relative()` yields a "../…" URI that GitHub
// Code Scanning silently drops. Acceptable here (paths come from user globs,
// typically under the workspace); flagged for future hardening.
function relativize(p: string): string {
  const base = process.env.GITHUB_WORKSPACE ?? process.cwd();
  return isAbsolute(p) ? relative(base, p) : p;
}

function toSarif(results: FileResult[], _clients?: string[], baseline?: BaselineOutcome): string {
  const rules = getRules().map((r) => {
    const descriptor: Record<string, unknown> = {
      id: r.id,
      name: r.name,
      shortDescription: { text: r.description },
      fullDescription: { text: `${r.why}\n\nFix: ${r.howToFix}` },
      defaultConfiguration: { level: LEVEL_MAP[r.severity] },
      properties: { category: r.category, severity: r.severity },
    };
    const helpUri = r.compatibility?.references[0]?.url;
    if (helpUri) descriptor.helpUri = helpUri;
    if (r.since) (descriptor.properties as Record<string, unknown>).since = r.since;
    return descriptor;
  });

  const sarifResults: Record<string, unknown>[] = [];
  if (baseline?.mode === "check") {
    for (const f of results) {
      if ("readError" in f) {
        sarifResults.push({
          level: "error",
          message: { text: f.readError },
          locations: [{ physicalLocation: { artifactLocation: { uri: relativize(f.path) } } }],
        });
      }
    }
    for (const ne of baseline.newErrors) {
      const s = ne.sample;
      const loc = { physicalLocation: { artifactLocation: { uri: relativize(ne.path) } } } as Record<string, unknown>;
      if (s.line) (loc.physicalLocation as Record<string, unknown>).region = { startLine: s.line, startColumn: s.column ?? 1 };
      sarifResults.push({
        ruleId: s.ruleId,
        level: LEVEL_MAP[s.severity],
        message: { text: `${s.message}${ne.count > 1 ? ` (x${ne.count}, example location)` : ""}` },
        locations: [loc],
      });
    }
  } else {
    for (const f of results) {
    if ("readError" in f) {
      sarifResults.push({
        level: "error",
        message: { text: f.readError },
        locations: [{ physicalLocation: { artifactLocation: { uri: relativize(f.path) } } }],
      });
      continue;
    }
    for (const is of f.result.issues) {
      const loc = { physicalLocation: { artifactLocation: { uri: relativize(f.path) } } } as Record<string, unknown>;
      if (is.line) (loc.physicalLocation as Record<string, unknown>).region = { startLine: is.line, startColumn: is.column ?? 1 };
      sarifResults.push({
        ruleId: is.ruleId,
        level: LEVEL_MAP[is.severity],
        message: { text: is.message },
        locations: [loc],
      });
    }
  }
  }

  return JSON.stringify({
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: { driver: { name: "emaillint", version: VERSION, informationUri: REPO_URL, rules } },
      results: sarifResults,
    }],
  }, null, 2);
}
