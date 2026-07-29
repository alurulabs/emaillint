import { describe, expect, it } from "vitest";
import { htmlMissingTitleRule } from "../../src/rules/accessibility/html-title.js";
import { buildEmailContext } from "../../src/parser/context.js";

describe("HTML_MISSING_TITLE", () => {
  it("flags <head> without a <title>", () => {
    const ctx = buildEmailContext("<html><head></head><body></body></html>");
    expect(htmlMissingTitleRule.check(ctx)).toHaveLength(1);
  });
  it("passes when <title> present in <head>", () => {
    const ctx = buildEmailContext("<html><head><title>X</title></head><body></body></html>");
    expect(htmlMissingTitleRule.check(ctx)).toHaveLength(0);
  });
});
