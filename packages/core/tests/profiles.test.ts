import { describe, it, expect } from "vitest";
import { PROFILES } from "../src/profiles.js";
import { analyze } from "../src/engine.js";

describe("PROFILES", () => {
  it("has exactly the three curated profiles", () => {
    expect(Object.keys(PROFILES).sort()).toEqual(["recommended", "relaxed", "strict"]);
  });

  it("recommended is identity (empty shift)", () => {
    expect(PROFILES.recommended).toEqual({});
  });

  it("strict promotes warning -> error and touches nothing else", () => {
    expect(PROFILES.strict).toEqual({ warning: "error" });
  });

  it("relaxed demotes warning -> info and touches nothing else", () => {
    expect(PROFILES.relaxed).toEqual({ warning: "info" });
  });
});

// HTML that triggers known-severity rules: CSS_FLEXBOX (warning), CSS_BORDER_RADIUS (info).
const FLEX = `<style>.x{display:flex}</style>`;
const RADIUS = `<style>.x{border-radius:5px}</style>`;
const flexIssues = (o?: Parameters<typeof analyze>[1]) =>
  analyze(FLEX, o).issues.filter((i) => i.ruleId === "CSS_FLEXBOX");
const radiusIssues = (o?: Parameters<typeof analyze>[1]) =>
  analyze(RADIUS, o).issues.filter((i) => i.ruleId === "CSS_BORDER_RADIUS");

describe("analyze profile behavior", () => {
  it("defaults to recommended (calibrated severities unchanged)", () => {
    expect(flexIssues().every((i) => i.severity === "warning")).toBe(true);
    expect(radiusIssues().every((i) => i.severity === "info")).toBe(true);
  });

  it("strict promotes warning -> error", () => {
    expect(flexIssues({ profile: "strict" }).every((i) => i.severity === "error")).toBe(true);
  });

  it("strict leaves info unchanged (border-radius stays info)", () => {
    expect(radiusIssues({ profile: "strict" }).every((i) => i.severity === "info")).toBe(true);
  });

  it("relaxed demotes warning -> info", () => {
    expect(flexIssues({ profile: "relaxed" }).every((i) => i.severity === "info")).toBe(true);
  });

  it("explicit rule override beats profile (absolute, not shifted)", () => {
    expect(flexIssues({ profile: "strict", rules: { CSS_FLEXBOX: "warning" } }).every((i) => i.severity === "warning")).toBe(true);
  });

  it('explicit "off" skips the rule even under a profile', () => {
    expect(flexIssues({ profile: "strict", rules: { CSS_FLEXBOX: "off" } })).toEqual([]);
  });

  it("profile applies to rules not enumerated anywhere (new-rule inclusion)", () => {
    const counts = flexIssues({ profile: "strict" }).length;
    expect(counts).toBeGreaterThan(0);
    expect(flexIssues({ profile: "strict" }).every((i) => i.severity === "error")).toBe(true);
  });
});
