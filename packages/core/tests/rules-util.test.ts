import { describe, it, expect } from "vitest";
import { makeIssue } from "../src/rules/util.js";
import type { EmailRule } from "../src/types/index.js";

const rule: EmailRule = {
  id: "X",
  name: "n",
  category: "quality",
  severity: "warning",
  description: "d",
  why: "",
  howToFix: "",
  check: () => [],
};

describe("makeIssue", () => {
  it("inherits rule id, category, default severity", () => {
    expect(makeIssue(rule, { message: "m" })).toMatchObject({
      ruleId: "X",
      category: "quality",
      severity: "warning",
      message: "m",
    });
  });

  it("overrides severity when given", () => {
    expect(makeIssue(rule, { message: "m", severity: "error" }).severity).toBe("error");
  });

  it("passes optional fields through", () => {
    const i = makeIssue(rule, { message: "m", line: 7, selector: "img", suggestion: "fix" });
    expect(i.line).toBe(7);
    expect(i.selector).toBe("img");
    expect(i.suggestion).toBe("fix");
  });
});
