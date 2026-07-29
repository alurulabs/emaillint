import { describe, it, expect } from "vitest";
import { analyze, getRule, getRules, validateRules } from "../src/engine.js";
import type { EmailRule } from "../src/types/index.js";

const base = {
  name: "x",
  category: "quality" as const,
  severity: "warning" as const,
  description: "d",
  why: "w",
  howToFix: "f",
  check: () => [],
};

const compatBase = {
  ...base,
  id: "CSS_X",
  category: "compatibility" as const,
  features: ["css-display-flex"],
  compatibility: {
    support: [{ client: "gmail-web", status: "unsupported" as const }],
    references: [{ title: "t", url: "https://x.example" }],
  },
};

describe("validateRules", () => {
  it("throws on missing id", () => {
    expect(() => validateRules([{ ...base, id: "" }])).toThrow(/missing id/);
  });

  it("throws on non-UPPERCASE_SNAKE id", () => {
    expect(() => validateRules([{ ...base, id: "lower_id" }])).toThrow(/UPPERCASE_SNAKE/);
  });

  it("throws on missing name", () => {
    expect(() => validateRules([{ ...base, id: "X_Y", name: "" }])).toThrow(/missing name/);
  });

  it("throws on missing why", () => {
    const { why, ...noWhy } = { ...base, id: "X_Y" };
    expect(() => validateRules([noWhy as unknown as EmailRule])).toThrow(/missing why/);
  });

  it("throws on duplicate id", () => {
    expect(() => validateRules([{ ...base, id: "DUP" }, { ...base, id: "DUP" }])).toThrow(
      /Duplicate rule id/,
    );
  });

  it("accepts a valid non-compat registry", () => {
    expect(() => validateRules([{ ...base, id: "AAA" }, { ...base, id: "BBB" }])).not.toThrow();
  });

  it("rejects compat rule without features", () => {
    expect(() =>
      validateRules([{ ...base, id: "CSS_X", category: "compatibility" }]),
    ).toThrow(/missing features/);
  });

  it("rejects compat rule without support", () => {
    expect(() =>
      validateRules([
        {
          ...compatBase,
          compatibility: { references: [{ title: "t", url: "https://x.example" }] },
        } as unknown as EmailRule,
      ]),
    ).toThrow(/missing support/);
  });

  it("rejects non-https reference", () => {
    expect(() =>
      validateRules([
        {
          ...base,
          id: "CSS_X",
          category: "compatibility",
          features: ["css-display-flex"],
          compatibility: {
            support: [{ client: "gmail-web", status: "unsupported" }],
            references: [{ title: "t", url: "http://x" }],
          },
        },
      ]),
    ).toThrow(/https/);
  });

  it("accepts a well-formed compat rule", () => {
    expect(() => validateRules([compatBase])).not.toThrow();
  });
});

describe("analyze", () => {
  it("returns score 100 and no issues on clean html", () => {
    const result = analyze(
      '<!DOCTYPE html><html lang="en"><head><title>T</title></head><body><p>hello</p></body></html>',
    );
    expect(result.score).toBe(100);
    expect(result.issues).toEqual([]);
  });

  it("throws TypeError on non-string", () => {
    expect(() => analyze(undefined as unknown as string)).toThrow(TypeError);
  });
});

describe("analyze options", () => {
  const html = '<div style="border-radius: 8px"></div>';

  it("off skips a rule", () => {
    const r = analyze(html, { rules: { CSS_BORDER_RADIUS: "off" } });
    expect(r.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(false);
  });

  it("override re-stamps severity and does not mutate the rule default", () => {
    const r = analyze(html, { rules: { CSS_BORDER_RADIUS: "error" } });
    expect(r.issues[0].severity).toBe("error");
    expect(getRule("CSS_BORDER_RADIUS")!.severity).toBe("info");
  });

  it("unknown rule id is ignored", () => {
    expect(() => analyze(html, { rules: { NOPE: "error" } })).not.toThrow();
  });

  it("zero-arg call is unchanged", () => {
    expect(analyze(html).issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(true);
  });

  it("is idempotent", () => {
    expect(analyze(html)).toEqual(analyze(html));
  });
});

describe("getRules", () => {
  it("returns a readonly array containing CSS_BORDER_RADIUS", () => {
    const list = getRules();
    expect(list.some((r) => r.id === "CSS_BORDER_RADIUS")).toBe(true);
  });

  it("getRule returns the rule by id", () => {
    expect(getRule("CSS_BORDER_RADIUS")?.id).toBe("CSS_BORDER_RADIUS");
    expect(getRule("NOPE")).toBeUndefined();
  });
});
