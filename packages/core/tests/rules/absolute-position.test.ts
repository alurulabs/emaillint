import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { absolutePositionRule } from "../../src/rules/compatibility/absolute-position.js";

const ctx = (html: string) => buildEmailContext(html);

describe("CSS_ABSOLUTE_POSITION", () => {
  it("flags position:absolute", () => {
    const issues = absolutePositionRule.check(ctx('<div style="position: absolute;"></div>'));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("CSS_ABSOLUTE_POSITION");
  });

  it("passes position:relative", () => {
    expect(absolutePositionRule.check(ctx('<div style="position: relative;"></div>'))).toHaveLength(0);
  });

  it("flags inline position:absolute !important", () => {
    expect(
      absolutePositionRule.check(ctx('<div style="position: absolute !important;"></div>')),
    ).toHaveLength(1);
  });
});
