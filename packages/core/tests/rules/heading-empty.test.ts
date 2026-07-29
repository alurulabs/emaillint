import { describe, expect, it } from "vitest";
import { headingEmptyRule } from "../../src/rules/accessibility/heading-empty.js";
import { buildEmailContext } from "../../src/parser/context.js";

describe("HEADING_EMPTY", () => {
  it("flags an empty <h1>", () => {
    const ctx = buildEmailContext("<h1></h1>");
    expect(headingEmptyRule.check(ctx)).toHaveLength(1);
  });
  it("passes when <h1> has text", () => {
    const ctx = buildEmailContext("<h1>Title</h1>");
    expect(headingEmptyRule.check(ctx)).toHaveLength(0);
  });
});
