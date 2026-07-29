import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { flexboxRule } from "../../src/rules/compatibility/flexbox.js";

const ctx = (html: string) => buildEmailContext(html);

describe("CSS_FLEXBOX", () => {
  it("flags inline display:flex", () => {
    const issues = flexboxRule.check(ctx('<div style="display: flex;"></div>'));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("CSS_FLEXBOX");
  });

  it("flags display:inline-flex", () => {
    expect(flexboxRule.check(ctx('<div style="display: inline-flex;"></div>'))).toHaveLength(1);
  });

  it("passes display:block", () => {
    expect(flexboxRule.check(ctx('<div style="display: block;"></div>'))).toHaveLength(0);
  });

  it("flags display:flex inside a <style> block with selector", () => {
    const issues = flexboxRule.check(ctx("<style>.a { display: flex; }</style>"));
    expect(issues).toHaveLength(1);
    expect(issues[0].selector).toBe(".a");
  });
});
