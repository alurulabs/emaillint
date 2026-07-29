import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { externalFontRule } from "../../src/rules/compatibility/external-font.js";

const ctx = (html: string) => buildEmailContext(html);

describe("CSS_EXTERNAL_FONT", () => {
  it("flags @font-face", () => {
    const issues = externalFontRule.check(ctx("<style>@font-face { font-family: x; }</style>"));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("CSS_EXTERNAL_FONT");
  });

  it("flags @import of a font URL", () => {
    const issues = externalFontRule.check(
      ctx("<style>@import url('https://fonts.googleapis.com/css?family=Roboto');</style>"),
    );
    expect(issues).toHaveLength(1);
  });

  it("passes a style block without external fonts", () => {
    expect(externalFontRule.check(ctx("<style>.a { color: red; }</style>"))).toHaveLength(0);
  });

  it("does not flag an @import whose URL merely contains 'font' (false-positive guard)", () => {
    const issues = externalFontRule.check(
      ctx("<style>@import url('https://example.com/assets/somefont-lib.css');</style>"),
    );
    expect(issues).toHaveLength(0);
  });

  it("flags an @import of a .woff2 font file", () => {
    const issues = externalFontRule.check(
      ctx("<style>@import url('https://example.com/fonts/brand.woff2');</style>"),
    );
    expect(issues).toHaveLength(1);
  });

  it("flags a font loaded via <link> (font authority)", () => {
    const issues = externalFontRule.check(
      ctx('<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">'),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("CSS_EXTERNAL_FONT");
  });

  it("dedupes <link> + @import of the SAME font URL to one finding", () => {
    const html =
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+3">' +
      "<style>@import url(https://fonts.googleapis.com/css?family=Source+Sans+3);</style>";
    const issues = externalFontRule.check(ctx(html));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("CSS_EXTERNAL_FONT");
  });

  it("still fires @font-face independently of a <link>", () => {
    const html =
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto">' +
      "<style>@font-face { font-family: x; src: url(x.woff); }</style>";
    const issues = externalFontRule.check(ctx(html));
    // one for the <link> font, one for the distinct @font-face source
    expect(issues).toHaveLength(2);
  });
});
