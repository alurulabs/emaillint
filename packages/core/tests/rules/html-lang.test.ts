import { describe, expect, it } from "vitest";
import { htmlMissingLangRule } from "../../src/rules/accessibility/html-lang.js";
import { buildEmailContext } from "../../src/parser/context.js";

describe("HTML_MISSING_LANG", () => {
  it("flags <html> without lang", () => {
    const ctx = buildEmailContext("<html><body></body></html>");
    expect(htmlMissingLangRule.check(ctx)).toHaveLength(1);
  });
  it("passes when lang present", () => {
    const ctx = buildEmailContext('<html lang="en"><body></body></html>');
    expect(htmlMissingLangRule.check(ctx)).toHaveLength(0);
  });
});
