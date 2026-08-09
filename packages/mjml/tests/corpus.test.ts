import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lint } from "../src/index.js";
import type { Issue } from "emaillint-core";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(here, "fixtures", name), "utf8");

function ruleIds(issues: Issue[]): string[] {
  return issues.map((i) => i.ruleId).sort();
}
function histogram(issues: Issue[]): Record<string, number> {
  const h: Record<string, number> = {};
  for (const i of issues) h[i.ruleId] = (h[i.ruleId] ?? 0) + 1;
  return h;
}
function tally(issues: Issue[]) {
  return {
    issues: issues.length,
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
  };
}

// Small canonical fixtures: pin exact rule IDs (sorted). Counts alone miss
// semantic drift (e.g. 4 issues stays 4 while the rule set changes).
describe("MJML corpus - small fixtures pin exact rule IDs", () => {
  const cases: Array<[string, string, string[]]> = [
    ["basic", "basic.mjml", ["CSS_EXTERNAL_FONT"]],
    ["image", "image.mjml", []],
    ["button", "button.mjml", ["CSS_BORDER_RADIUS", "CSS_BORDER_RADIUS", "CSS_EXTERNAL_FONT"]],
    ["columns", "columns.mjml", ["CSS_EXTERNAL_FONT"]],
    ["typography", "typography.mjml", []],
  ];
  for (const [label, file, expected] of cases) {
    it(`${label} fires the pinned rule set`, async () => {
      const result = await lint(fixture(file));
      expect(ruleIds(result.issues)).toEqual(expected);
    });
  }
});

// Large/realistic fixtures: pin aggregate counts + a rule histogram.
describe("MJML corpus - large fixtures pin counts + histogram", () => {
  const cases: Array<[string, string, object, object]> = [
    [
      "outlook",
      "outlook.mjml",
      { issues: 3, errors: 0, warnings: 1, info: 2 },
      { CSS_BORDER_RADIUS: 2, CSS_EXTERNAL_FONT: 1 },
    ],
    [
      "cerberus",
      "cerberus.mjml",
      { issues: 4, errors: 0, warnings: 2, info: 2 },
      { CSS_BORDER_RADIUS: 2, CSS_EXTERNAL_FONT: 1, CSS_OVERFLOW: 1 },
    ],
  ];
  for (const [label, file, expectedTally, expectedHistogram] of cases) {
    it(`${label} matches the pinned tally + histogram`, async () => {
      const result = await lint(fixture(file));
      expect(tally(result.issues)).toEqual(expectedTally);
      expect(histogram(result.issues)).toEqual(expectedHistogram);
    });
  }
});
