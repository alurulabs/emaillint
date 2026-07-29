import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { htmlSizeRule } from "../../src/rules/performance/html-size.js";

describe("HTML_SIZE_EXCEEDED", () => {
  it("passes when under 80KB", () => {
    const c = buildEmailContext("<p>small</p>");
    expect(htmlSizeRule.check(c)).toHaveLength(0);
  });

  it("warns at 80–102KB", () => {
    const c = buildEmailContext("<!-- " + "x".repeat(85 * 1024) + " -->");
    const issues = htmlSizeRule.check(c);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].ruleId).toBe("HTML_SIZE_EXCEEDED");
    expect(issues[0].category).toBe("performance");
  });

  it("errors above 102KB", () => {
    const c = buildEmailContext("<!-- " + "x".repeat(110 * 1024) + " -->");
    const issues = htmlSizeRule.check(c);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("error");
    expect(issues[0].ruleId).toBe("HTML_SIZE_EXCEEDED");
    expect(issues[0].category).toBe("performance");
  });

  it("reports no location", () => {
    const c = buildEmailContext("<!-- " + "x".repeat(85 * 1024) + " -->");
    expect(htmlSizeRule.check(c)[0].line).toBeUndefined();
  });
});

describe("HTML_SIZE_EXCEEDED boundaries", () => {
  it("exactly 80KB (81920) warns", () => {
    const c = buildEmailContext("<!-- " + "x".repeat(81920 - 9) + " -->");
    expect(c.sizeBytes).toBe(81920);
    const issues = htmlSizeRule.check(c);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("warning");
  });

  it("just under 80KB (81919 bytes total) passes", () => {
    const c = buildEmailContext("<!-- " + "x".repeat(81919 - 9) + " -->");
    expect(htmlSizeRule.check(c)).toHaveLength(0);
  });

  it("exactly 102KB (104448) warns (error boundary is strict >)", () => {
    const c = buildEmailContext("<!-- " + "x".repeat(104448 - 9) + " -->");
    const issues = htmlSizeRule.check(c);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("warning");
  });

  it("just over 102KB (104449 bytes total) errors", () => {
    const c = buildEmailContext("<!-- " + "x".repeat(104449 - 9) + " -->");
    const issues = htmlSizeRule.check(c);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("error");
  });
});
