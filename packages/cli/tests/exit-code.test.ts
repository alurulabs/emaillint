import { describe, it, expect } from "vitest";
import { exitCode } from "../src/exit-code.js";
import type { RunResult } from "../src/types.js";

const mk = (results: RunResult["results"]): RunResult => ({ results });

describe("exitCode", () => {
  it("0 when only warnings/info", () => {
    expect(
      exitCode(
        mk([
          {
            path: "a",
            result: { score: 90, issues: [{ ruleId: "X", severity: "warning", category: "compatibility", message: "m" }] },
          },
        ]),
      ),
    ).toBe(0);
  });

  it("1 on an error-severity issue", () => {
    expect(
      exitCode(
        mk([
          {
            path: "a",
            result: { score: 50, issues: [{ ruleId: "X", severity: "error", category: "invalid", message: "m" }] },
          },
        ]),
      ),
    ).toBe(1);
  });

  it("1 on a readError", () => {
    expect(exitCode(mk([{ path: "a", readError: "enoent" }]))).toBe(1);
  });

  it("0 on clean", () => {
    expect(exitCode(mk([{ path: "a", result: { score: 100, issues: [] } }]))).toBe(0);
  });
});

describe("exitCode: baseline", () => {
  const scriptErr = { ruleId: "SCRIPT_ELEMENT", severity: "error", category: "invalid", message: "m" };

  it("1 when baseline check has new errors", () => {
    const rr: RunResult = {
      results: [{ path: "a", result: { score: 50, issues: [] } }],
      baseline: { mode: "check", newErrors: [{ path: "a", fingerprint: "X", count: 1, sample: scriptErr }], suppressed: 0 },
    };
    expect(exitCode(rr)).toBe(1);
  });

  it("0 when baseline check has no new errors (even if raw issues exist)", () => {
    const rr: RunResult = {
      results: [{ path: "a", result: { score: 50, issues: [scriptErr] } }],
      baseline: { mode: "check", newErrors: [], suppressed: 1 },
    };
    expect(exitCode(rr)).toBe(0);
  });

  it("update mode never fails the lint gate", () => {
    const rr: RunResult = {
      results: [{ path: "a", result: { score: 50, issues: [scriptErr] } }],
      baseline: { mode: "update", newErrors: [], suppressed: 0 },
    };
    expect(exitCode(rr)).toBe(0);
  });

  it("readError still fails even under baseline", () => {
    const rr: RunResult = {
      results: [{ path: "a", readError: "enoent" }],
      baseline: { mode: "check", newErrors: [], suppressed: 0 },
    };
    expect(exitCode(rr)).toBe(1);
  });
});
