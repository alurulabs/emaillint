import type { RunResult } from "./types.js";

export function exitCode(rr: RunResult): 0 | 1 {
  for (const f of rr.results) {
    if ("readError" in f) return 1;
    if (f.result.issues.some((i) => i.severity === "error")) return 1;
  }
  return 0;
}
