import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { backgroundImageRule } from "../../src/rules/compatibility/background-image.js";

const ctx = (html: string) => buildEmailContext(html);

describe("CSS_BACKGROUND_IMAGE", () => {
  it("flags background-image", () => {
    const issues = backgroundImageRule.check(ctx('<div style="background-image: url(a.png);"></div>'));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("CSS_BACKGROUND_IMAGE");
  });

  it("flags background shorthand with image", () => {
    expect(
      backgroundImageRule.check(ctx('<div style="background: url(a.png) no-repeat;"></div>')),
    ).toHaveLength(1);
  });

  it("passes background-color", () => {
    expect(backgroundImageRule.check(ctx('<div style="background-color: red;"></div>'))).toHaveLength(0);
  });

  it("downgrades to info when a VML fallback URL matches", () => {
    const html =
      '<div style="background-image: url(hero.png);"></div>' +
      '<!--[if mso]><v:rect><v:fill type="frame" src="hero.png" /></v:rect><![endif]-->';
    const issues = backgroundImageRule.check(ctx(html));
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("info");
  });

  it("stays warning when the VML fallback URL differs", () => {
    const html =
      '<div style="background-image: url(hero.png);"></div>' +
      '<!--[if mso]><v:rect><v:fill type="frame" src="other.png" /></v:rect><![endif]-->';
    const issues = backgroundImageRule.check(ctx(html));
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("warning");
  });

  it("stays warning when no VML fallback exists", () => {
    const issues = backgroundImageRule.check(ctx('<div style="background-image: url(a.png);"></div>'));
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("warning");
  });
});
