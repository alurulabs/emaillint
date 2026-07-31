import { describe, it, expect } from "vitest";
import * as api from "../src/index.js";
import { analyze } from "../src/index.js";
import type {
  AnalysisResult,
  Category,
  ConditionalComment,
  CSSAtRule,
  CSSDeclaration,
  ElementInfo,
  EmailContext,
  EmailRule,
  ImageInfo,
  Issue,
  LinkInfo,
  Severity,
} from "../src/index.js";

describe("public API", () => {
  it("exports analyze", () => {
    const result: AnalysisResult = analyze(
      '<!DOCTYPE html><html lang="en"><head><title>T</title></head><body><p>ok</p></body></html>',
    );
    expect(result.score).toBe(100);
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it("runs all rules over a problematic email", () => {
    const result = analyze('<img src="a.png"><a>no link</a>');
    const ids = result.issues.map((i: Issue) => i.ruleId);
    expect(ids).toContain("IMG_MISSING_ALT");
    expect(ids).toContain("EMPTY_LINK");
  });

  it("exposes the type unions", () => {
    const c: Category = "quality";
    const s: Severity = "warning";
    expect([c, s]).toEqual(["quality", "warning"]);
  });

  it("exports all rule-author and result types (compile-time contract)", () => {
    const _ctx: EmailContext | undefined = undefined;
    const _rule: EmailRule | undefined = undefined;
    const _element: ElementInfo | undefined = undefined;
    const _image: ImageInfo | undefined = undefined;
    const _link: LinkInfo | undefined = undefined;
    const _decl: CSSDeclaration | undefined = undefined;
    const _atRule: CSSAtRule | undefined = undefined;
    const _comment: ConditionalComment | undefined = undefined;
    const _issue: Issue | undefined = undefined;
    const _result: AnalysisResult | undefined = undefined;
    const _category: Category = "quality";
    const _severity: Severity = "warning";
    expect([_ctx, _rule, _element, _image, _link, _decl, _atRule, _comment, _issue, _result, _category, _severity]).toBeDefined();
  });

  it("public value surface is the phase-2 contract (no internal leakage)", () => {
    expect(Object.keys(api).sort()).toEqual([
      "CLIENT_IDS",
      "CLIENT_PRESETS",
      "KNOWN_CLIENTS",
      "analyze",
      "getCompatDataVersion",
      "getRule",
      "getRules",
    ]);
    expect(typeof api.getCompatDataVersion).toBe("function");
    expect(api.getCompatDataVersion()).toMatch(/^caniemail@/); // real snapshot, not a stub
  });
});
