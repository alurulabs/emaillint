import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { base64ImageRule } from "../../src/rules/performance/base64-image.js";

const ctx = (html: string) => buildEmailContext(html);

describe("BASE64_IMAGE", () => {
  it("flags a data: URI image at info severity", () => {
    const issues = base64ImageRule.check(ctx('<img alt="" src="data:image/png;base64,iVBORw0KGgo=">'));
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("info");
  });

  it("passes a URL image", () => {
    expect(base64ImageRule.check(ctx('<img src="https://example.com/a.png">'))).toHaveLength(0);
  });
});
