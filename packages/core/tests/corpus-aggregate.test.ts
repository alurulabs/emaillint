import { describe, expect, it } from "vitest";
import type { Category, Issue, Severity } from "../src/types/index.js";
import {
  aggregateByRule,
  computeZeroHit,
  distribution,
  topRuleIds,
  type RuleAggregate,
  type TemplateResult,
} from "../scripts/corpus/aggregate.js";

function issue(
  ruleId: string,
  severity: Severity = "warning",
  category: Category = "compatibility",
  message = "m",
): Issue {
  return { ruleId, severity, category, message } as Issue;
}

function tpl(name: string, issues: Issue[]): TemplateResult {
  return { name, source: "synthetic", sizeBytes: 100, score: 50, issues };
}

describe("distribution", () => {
  it("returns zeros for an empty corpus", () => {
    expect(distribution([])).toEqual({ avg: 0, median: 0, max: 0 });
  });

  it("handles a single template", () => {
    expect(distribution([tpl("a", [issue("R1")])])).toEqual({
      avg: 1,
      median: 1,
      max: 1,
    });
  });

  it("computes avg/median/max with an odd count", () => {
    // issue counts: 50, 2, 0 -> sorted [0,2,50]
    const results = [
      tpl("a", new Array(50).fill(0).map(() => issue("R1"))),
      tpl("b", [issue("R1"), issue("R2")]),
      tpl("c", []),
    ];
    const d = distribution(results);
    expect(d.avg).toBeCloseTo((50 + 2 + 0) / 3, 5);
    expect(d.median).toBe(2);
    expect(d.max).toBe(50);
  });

  it("computes median as the mean of the two middle values with an even count", () => {
    // issue counts: 1,2,3,4 -> median (2+3)/2 = 2.5
    const results = [
      tpl("a", [issue("R1")]),
      tpl("b", [issue("R1"), issue("R2")]),
      tpl("c", [issue("R1"), issue("R2"), issue("R3")]),
      tpl("d", [issue("R1"), issue("R2"), issue("R3"), issue("R4")]),
    ];
    expect(distribution(results).median).toBe(2.5);
  });
});

describe("aggregateByRule", () => {
  it("returns an empty array for an empty corpus", () => {
    expect(aggregateByRule([])).toEqual([]);
  });

  it("aggregates a single issue with 100% prevalence and a sample carrying the template name", () => {
    const [r] = aggregateByRule([tpl("a.html", [issue("R1", "warning", "compatibility", "bad css")])]);
    expect(r.ruleId).toBe("R1");
    expect(r.severity).toBe("warning");
    expect(r.category).toBe("compatibility");
    expect(r.hits).toBe(1);
    expect(r.templateCount).toBe(1);
    expect(r.templatePrevalence).toBe(100);
    expect(r.samples).toEqual([
      { template: "a.html", message: "bad css", line: undefined, column: undefined },
    ]);
  });

  it("counts distinct templates, not occurrences (same rule twice in one template)", () => {
    const [r] = aggregateByRule([tpl("a.html", [issue("R1"), issue("R1")])]);
    expect(r.hits).toBe(2);
    expect(r.templateCount).toBe(1);
    expect(r.templatePrevalence).toBe(100);
  });

  it("computes prevalence as templateCount / totalTemplates", () => {
    const agg = aggregateByRule([
      tpl("a.html", [issue("R1")]),
      tpl("b.html", []),
    ]);
    expect(agg[0]).toMatchObject({ ruleId: "R1", templateCount: 1, templatePrevalence: 50 });
  });

  it("caps samples at 3", () => {
    const [r] = aggregateByRule([
      tpl("a.html", [
        issue("R1", "warning", "compatibility", "one"),
        issue("R1", "warning", "compatibility", "two"),
        issue("R1", "warning", "compatibility", "three"),
        issue("R1", "warning", "compatibility", "four"),
      ]),
    ]);
    expect(r.samples).toHaveLength(3);
    expect(r.samples.map((s) => s.message)).toEqual(["one", "two", "three"]);
  });

  it("sorts by prevalence desc, then hits desc", () => {
    const agg = aggregateByRule([
      // R1 in 1/2 templates (50%), 1 hit
      tpl("a.html", [issue("R1")]),
      // R2 in 2/2 templates (100%), 2 hits
      tpl("a.html", [issue("R2")]),
      tpl("b.html", [issue("R2")]),
    ]);
    expect(agg.map((r) => r.ruleId)).toEqual(["R2", "R1"]);
  });

  it("derives severity and category from the issue", () => {
    const [r] = aggregateByRule([
      tpl("a.html", [issue("R9", "error", "accessibility", "x")]),
    ]);
    expect(r).toMatchObject({ severity: "error", category: "accessibility" });
  });
});

describe("topRuleIds", () => {
  it("returns rule ids sorted by hit count desc, capped at limit", () => {
    const issues = [
      issue("A"),
      issue("B"),
      issue("B"),
      issue("C"),
      issue("C"),
      issue("C"),
    ];
    expect(topRuleIds(issues, 2)).toEqual(["C", "B"]);
  });

  it("returns an empty array when there are no issues", () => {
    expect(topRuleIds([], 5)).toEqual([]);
  });
});

describe("computeZeroHit", () => {
  it("returns registered ids that never fired, preserving registry order", () => {
    const byRule = [
      { ruleId: "A" } as RuleAggregate,
      { ruleId: "C" } as RuleAggregate,
    ];
    expect(computeZeroHit(byRule, ["A", "B", "C", "D"])).toEqual(["B", "D"]);
  });

  it("returns all registered ids when nothing fired", () => {
    expect(computeZeroHit([], ["A", "B"])).toEqual(["A", "B"]);
  });
});
