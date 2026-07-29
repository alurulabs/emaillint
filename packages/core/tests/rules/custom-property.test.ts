import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { customPropertyRule } from "../../src/rules/compatibility/custom-property.js";

const ctx = (html: string) => buildEmailContext(html);

describe("CSS_CUSTOM_PROPERTY", () => {
  it("flags var(--…) usage", () => {
    const issues = customPropertyRule.check(ctx('<div style="color: var(--brand);"></div>'));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("CSS_CUSTOM_PROPERTY");
  });

  it("passes a literal color", () => {
    expect(customPropertyRule.check(ctx('<div style="color: red;"></div>'))).toHaveLength(0);
  });
});
