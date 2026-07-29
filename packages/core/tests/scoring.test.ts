import { describe, it, expect } from "vitest";
import { calculateScore } from "../src/scoring/index.js";
import type { Issue } from "../src/types/index.js";

const issue = (severity: Issue["severity"], ruleId = "x"): Issue => ({
  ruleId,
  severity,
  category: "quality",
  message: "",
});

describe("calculateScore", () => {
  it("is 100 with no issues", () => {
    expect(calculateScore([])).toBe(100);
  });

  it("info contributes 0 — notes do not penalize", () => {
    expect(calculateScore([issue("info"), issue("info"), issue("info")])).toBe(100);
  });

  it("subtracts 15 for an error, 5 for a warning", () => {
    expect(calculateScore([issue("error", "a")])).toBe(85);
    expect(calculateScore([issue("warning", "a")])).toBe(95);
  });

  it("caps a single rule's total penalty at 15 (saturation fix)", () => {
    // 10 warnings of the SAME rule: 10*5=50 -> capped at 15 -> score 85
    const tenSame = Array.from({ length: 10 }, () => issue("warning", "a"));
    expect(calculateScore(tenSame)).toBe(85);
  });

  it("does not cap across distinct rules", () => {
    // 10 warnings, 10 distinct rules: 10*5=50, none capped -> score 50
    const tenDistinct = Array.from({ length: 10 }, (_, i) => issue("warning", `r${i}`));
    expect(calculateScore(tenDistinct)).toBe(50);
  });

  it("caps a mixed-severity rule on its summed total", () => {
    // rule "a": 2 warning (10) + 1 error (15) = 25 -> capped 15; rule "b": 1 warning = 5; total 20 -> 80
    const issues = [
      issue("warning", "a"),
      issue("warning", "a"),
      issue("error", "a"),
      issue("warning", "b"),
    ];
    expect(calculateScore(issues)).toBe(80);
  });

  it("floors at 0", () => {
    // 10 distinct errors: 10*15=150 -> 100-150 -> floored 0
    const many = Array.from({ length: 10 }, (_, i) => issue("error", `r${i}`));
    expect(calculateScore(many)).toBe(0);
  });

  it("preserves ranking: distinct rules score lower than a same-rule flood at equal count", () => {
    const sameRule = Array.from({ length: 5 }, () => issue("warning", "a")); // capped 15 -> 85
    const distinct = Array.from({ length: 5 }, (_, i) => issue("warning", `r${i}`)); // 25 -> 75
    expect(calculateScore(distinct)).toBeLessThan(calculateScore(sameRule));
  });
});
