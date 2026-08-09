import { describe, it, expect } from "vitest";
import { makeIssue, getReferences } from "../src/rules/util.js";
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

const stub: EmailRule = {
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

  it("never sets an explanation field (dead field removed)", () => {
    const i = makeIssue(rule, { message: "m" });
    expect("explanation" in i).toBe(false);
  });
});

describe("getReferences", () => {
  it("returns top-level references when present", () => {
    const rule: EmailRule = { ...stub, references: [{ title: "t", url: "https://x.example" }] };
    expect(getReferences(rule)).toEqual([{ title: "t", url: "https://x.example" }]);
  });

  it("falls back to compatibility.references for compat rules", () => {
    const rule: EmailRule = {
      ...stub, category: "compatibility",
      compatibility: {
        support: [{ client: "gmail-desktop-webmail", status: "unsupported" }],
        references: [{ title: "c", url: "https://c.example" }],
      },
    };
    expect(getReferences(rule)).toEqual([{ title: "c", url: "https://c.example" }]);
  });

  it("returns [] when neither top-level nor compat references are present", () => {
    expect(getReferences(stub)).toEqual([]);
  });

  it("prefers top-level references over compat when both are set", () => {
    const rule: EmailRule = {
      ...stub, references: [{ title: "top", url: "https://top.example" }],
      compatibility: { support: [], references: [{ title: "nested", url: "https://nested.example" }] },
    };
    expect(getReferences(rule).map((r) => r.title)).toEqual(["top"]);
  });
});
