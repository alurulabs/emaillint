import type { RunResult } from "./types.js";

export function exitCode(rr: RunResult): 0 | 1 {
  for (const f of rr.results) {
    if ("readError" in f) return 1;
  }
  // Baseline gate: fail only on NEW errors (check mode). Update mode never fails the lint gate.
  if (rr.baseline) {
    return rr.baseline.mode === "check" && rr.baseline.newErrors.length > 0 ? 1 : 0;
  }
  for (const f of rr.results) {
    if ("result" in f && f.result.issues.some((i) => i.severity === "error")) return 1;
  }
  return 0;
}
