// packages/cli/src/reporter.ts
import type { RunResult, Format, FileResult } from "./types.js";
import { getCompatDataVersion } from "emaillint-core";

export function format(rr: RunResult, fmt: Format): string {
  const sorted: FileResult[] = [...rr.results].sort((x, y) => (x.path < y.path ? -1 : x.path > y.path ? 1 : 0));
  if (fmt === "json") return toJson(sorted, rr.clients);
  return toText(sorted);
}

function toText(results: FileResult[]): string {
  const lines: string[] = [];
  let errors = 0, warnings = 0, info = 0;
  for (const f of results) {
    if ("readError" in f) { lines.push(`${f.path}:  error: ${f.readError}`); errors++; continue; }
    for (const is of f.result.issues) {
      if (is.severity === "error") errors++;
      else if (is.severity === "warning") warnings++;
      else info++;
      const loc = is.line ? `${is.line}:${is.column ?? 1}  ` : "";
      lines.push(`${f.path}:${loc}${is.ruleId}  ${is.severity}  ${is.message}`);
    }
  }
  const total = errors + warnings + info;
  lines.push(`${results.length} files, ${total} issues (${errors} errors, ${warnings} warnings, ${info} info)`);
  return lines.join("\n");
}

function toJson(results: FileResult[], clients?: string[]): string {
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
  return JSON.stringify(payload, null, 2);
}
