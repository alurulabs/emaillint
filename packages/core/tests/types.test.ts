import { describe, it, expect } from "vitest";
import type { Issue, Category, Severity, AnalysisResult } from "../src/types/index.js";

describe("types", () => {
  it("constructs a minimal Issue", () => {
    const issue: Issue = {
      ruleId: "X",
      severity: "warning",
      category: "quality",
      message: "m",
    };
    expect(issue.ruleId).toBe("X");
    expect(issue.line).toBeUndefined();
  });

  it("Category and Severity are the expected unions", () => {
    const categories: Category[] = ["compatibility", "invalid", "accessibility", "performance", "quality"];
    const severities: Severity[] = ["error", "warning", "info"];
    expect(categories).toHaveLength(5);
    expect(severities).toHaveLength(3);
  });

  it("AnalysisResult is score + issues", () => {
    const result: AnalysisResult = { score: 100, issues: [] };
    expect(result.score).toBe(100);
  });
});
