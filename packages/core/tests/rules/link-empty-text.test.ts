import { describe, expect, it } from "vitest";
import { linkEmptyTextRule } from "../../src/rules/accessibility/link-empty-text.js";
import { buildEmailContext } from "../../src/parser/context.js";

describe("LINK_EMPTY_TEXT", () => {
  it("flags <a> with empty text", () => {
    const ctx = buildEmailContext('<a href="x"></a>');
    expect(linkEmptyTextRule.check(ctx)).toHaveLength(1);
  });
  it("passes when <a> has text", () => {
    const ctx = buildEmailContext('<a href="x">Go</a>');
    expect(linkEmptyTextRule.check(ctx)).toHaveLength(0);
  });
  it("passes when <a> wraps an image with alt text (accessible name)", () => {
    const ctx = buildEmailContext('<a href="x"><img src="i.png" alt="Facebook"></a>');
    expect(linkEmptyTextRule.check(ctx)).toHaveLength(0);
  });
  it("flags <a> wrapping an image with empty alt (decorative, no accessible name)", () => {
    const ctx = buildEmailContext('<a href="x"><img src="i.png" alt=""></a>');
    expect(linkEmptyTextRule.check(ctx)).toHaveLength(1);
  });
});
