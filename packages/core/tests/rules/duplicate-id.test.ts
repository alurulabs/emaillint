import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../../src/parser/context.js";
import { duplicateIdRule } from "../../src/rules/quality/duplicate-id.js";

const ctx = (html: string) => buildEmailContext(html);

describe("DUPLICATE_ID", () => {
  it("flags two elements sharing an id", () => {
    const issues = duplicateIdRule.check(ctx('<div id="x"></div><div id="x"></div>'));
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("DUPLICATE_ID");
  });

  it("reports one issue per duplicated id", () => {
    const issues = duplicateIdRule.check(
      ctx('<div id="a"></div><div id="a"></div><div id="b"></div><div id="b"></div>'),
    );
    expect(issues).toHaveLength(2);
  });

  it("passes when all ids are unique", () => {
    expect(duplicateIdRule.check(ctx('<div id="a"></div><div id="b"></div>'))).toHaveLength(0);
  });
});
