import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { emptyLinkRule } from "../../src/rules/quality/empty-link.js";

const ctx = (html: string) => buildEmailContext(html);

describe("EMPTY_LINK", () => {
  it("flags <a> without href", () => {
    expect(emptyLinkRule.check(ctx("<a>x</a>"))).toHaveLength(1);
  });

  it("flags <a> with empty href", () => {
    expect(emptyLinkRule.check(ctx('<a href="">x</a>'))).toHaveLength(1);
  });

  it("passes <a> with a real href", () => {
    expect(emptyLinkRule.check(ctx('<a href="https://example.com">x</a>'))).toHaveLength(0);
  });

  it("passes <a href='#'> (not flagged in Phase 1)", () => {
    expect(emptyLinkRule.check(ctx('<a href="#">x</a>'))).toHaveLength(0);
  });
});
