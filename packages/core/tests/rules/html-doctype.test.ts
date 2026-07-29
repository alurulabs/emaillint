import { describe, expect, it } from "vitest";
import { htmlMissingDoctypeRule } from "../../src/rules/quality/html-doctype.js";
import { buildEmailContext } from "../../src/parser/context.js";

describe("HTML_MISSING_DOCTYPE", () => {
  it("flags <html> without <!DOCTYPE html>", () => {
    const ctx = buildEmailContext("<html></html>");
    expect(htmlMissingDoctypeRule.check(ctx)).toHaveLength(1);
  });
  it("passes when <!DOCTYPE html> present", () => {
    const ctx = buildEmailContext("<!DOCTYPE html><html></html>");
    expect(htmlMissingDoctypeRule.check(ctx)).toHaveLength(0);
  });
});
