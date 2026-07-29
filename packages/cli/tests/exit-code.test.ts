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
