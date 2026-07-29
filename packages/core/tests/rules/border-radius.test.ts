import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { borderRadiusRule } from "../../src/rules/compatibility/border-radius.js";

const ctx = (html: string) => buildEmailContext(html);

describe("CSS_BORDER_RADIUS", () => {
  it("flags inline border-radius", () => {
    const issues = borderRadiusRule.check(ctx('<div style="border-radius: 8px;"></div>'));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("CSS_BORDER_RADIUS");
    expect(issues[0].severity).toBe("info");
  });

  it("flags border-radius in a <style> block", () => {
    expect(borderRadiusRule.check(ctx("<style>.b { border-radius: 4px; }</style>"))).toHaveLength(1);
  });

  it("passes other properties", () => {
    expect(borderRadiusRule.check(ctx('<div style="color: red;"></div>'))).toHaveLength(0);
  });
});
