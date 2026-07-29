import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { imgMissingAltRule } from "../../src/rules/accessibility/img-missing-alt.js";

const ctx = (html: string) => buildEmailContext(html);

describe("IMG_MISSING_ALT", () => {
  it("flags an img without alt", () => {
    const issues = imgMissingAltRule.check(ctx('<img src="a.png">'));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("IMG_MISSING_ALT");
  });

  it("passes an img with descriptive alt", () => {
    expect(imgMissingAltRule.check(ctx('<img src="a.png" alt="Logo">'))).toHaveLength(0);
  });

  it("passes an img with empty alt (decorative)", () => {
    expect(imgMissingAltRule.check(ctx('<img src="a.png" alt="">'))).toHaveLength(0);
  });
});
