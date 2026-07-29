import { describe, expect, it } from "vitest";
import { cssRules, cssRuleSpecs } from "../../src/rules/compatibility/css-rules.js";
import type { EmailContext } from "../../src/types/index.js";

function ctxWith(decls: { property: string; value: string }[]): EmailContext {
  return {
    html: "",
    sizeBytes: 0,
    elements: [],
    images: [],
    links: [],
    cssDeclarations: decls.map((d) => ({ ...d, source: "inline" as const })),
    cssAtRules: [],
    conditionalComments: [],
    headings: [],
    doctype: null,
  };
}

describe.each(cssRuleSpecs.map((s, i) => ({ spec: s, rule: cssRules[i] })))(
  "css rule $spec.id",
  ({ spec, rule }) => {
    it("triggers on every declared property with a matching value", () => {
      // Positively exercise EVERY property in spec.properties. Property-agnostic
      // specs (CSS_CALC, CSS_MIN_MAX_CLAMP) declare none — exercise one property.
      const props = spec.properties ?? ["x"];
      let value = "flex";
      if (spec.unlessValue) value = spec.unlessValue === "none" ? "block" : "other";
      if (spec.matchValue) {
        value = "calc(100% - 10px)";
        if (!spec.matchValue(value)) value = "grid";
        // Plan-bug fix: the two-value fallback above doesn't satisfy every
        // matchValue predicate — CSS_FIXED_POSITION needs "fixed", and
        // CSS_MIN_MAX_CLAMP needs min()/max()/clamp(). Extend the chain so the
        // positive input genuinely matches each spec.
        if (!spec.matchValue(value)) value = "fixed";
        if (!spec.matchValue(value)) value = "min(100%)";
      }
      for (const prop of props) {
        const issues = rule.check(ctxWith([{ property: prop, value }]));
        expect(issues.length, `property "${prop}"`).toBeGreaterThan(0);
        expect(issues[0].ruleId).toBe(spec.id);
      }
    });

    it("does not trigger on an unrelated declaration", () => {
      const issues = rule.check(ctxWith([{ property: "color", value: "red" }]));
      expect(issues).toHaveLength(0);
    });

    if (spec.unlessValue) {
      const unlessValue = spec.unlessValue;
      it("does not trigger when value equals unlessValue", () => {
        // Near-miss: CSS_OVERFLOW skips "visible"; CSS_FLOAT/TRANSFORM/FILTER/
        // BACKDROP_FILTER skip "none"; CSS_MIX_BLEND_MODE skips "normal".
        const prop = spec.properties?.[0] ?? "x";
        const issues = rule.check(ctxWith([{ property: prop, value: unlessValue }]));
        expect(issues).toHaveLength(0);
      });
    }
  },
);
