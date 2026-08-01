import { describe, it, expect } from "vitest";
import { analyze, getRule, getRules, validateRules } from "../src/engine.js";
import { CLIENT_IDS } from "../src/rules/presets.js";
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

describe("analyze client filtering", () => {
  // CSS_BORDER_RADIUS (css-border-radius): supported in gmail-desktop-webmail,
  // unsupported in outlook-windows, partial in yahoo-desktop-webmail.
  const html = '<div style="border-radius: 8px"></div>';

  it("suppresses a compat issue when the feature is supported in all selected clients", () => {
    const r = analyze(html, { clients: ["gmail-desktop-webmail"] });
    expect(r.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(false);
  });

  it("keeps a compat issue and stamps compatScope when a selected client is unsupported", () => {
    const r = analyze(html, { clients: ["outlook-windows"] });
    const issue = r.issues.find((i) => i.ruleId === "CSS_BORDER_RADIUS");
    expect(issue).toBeTruthy();
    expect(issue!.compatScope).toEqual({ status: "unsupported" });
  });

  it("keeps the issue with compatScope partial when a selected client is partial", () => {
    const r = analyze(html, { clients: ["yahoo-desktop-webmail"] });
    const issue = r.issues.find((i) => i.ruleId === "CSS_BORDER_RADIUS");
    expect(issue).toBeTruthy();
    expect(issue!.compatScope).toEqual({ status: "partial" });
  });

  it("keeps the issue with the worst status across multiple selected clients", () => {
    const r = analyze(html, { clients: ["gmail-desktop-webmail", "outlook-windows"] });
    const issue = r.issues.find((i) => i.ruleId === "CSS_BORDER_RADIUS");
    expect(issue).toBeTruthy();
    expect(issue!.compatScope).toEqual({ status: "unsupported" }); // worst of supported + unsupported
  });

  it("suppresses when every selected client supports the feature (multi-client)", () => {
    // both gmail-desktop-webmail and apple-mail-macos support css-border-radius
    const r = analyze(html, { clients: ["gmail-desktop-webmail", "apple-mail-macos"] });
    expect(r.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(false);
  });

  it("a severity override does not resurrect a client-suppressed issue", () => {
    const r = analyze(html, { rules: { CSS_BORDER_RADIUS: "error" }, clients: ["gmail-desktop-webmail"] });
    expect(r.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(false);
  });

  it("override + filter compose on a kept issue", () => {
    const r = analyze(html, { rules: { CSS_BORDER_RADIUS: "error" }, clients: ["outlook-windows"] });
    const issue = r.issues.find((i) => i.ruleId === "CSS_BORDER_RADIUS");
    expect(issue).toBeTruthy();
    expect(issue!.severity).toBe("error");
    expect(issue!.compatScope).toEqual({ status: "unsupported" });
  });

  it("does not filter non-compat rules", () => {
    const alt = '<img src="a.png">';
    const withClients = analyze(alt, { clients: ["gmail-desktop-webmail"] });
    const without = analyze(alt);
    const nonCompat = (r: typeof withClients) => r.issues.filter((i) => i.category !== "compatibility");
    expect(nonCompat(withClients)).toEqual(nonCompat(without));
  });

  it("no clients arg = unchanged (no compatScope stamped)", () => {
    const r = analyze(html);
    const issue = r.issues.find((i) => i.ruleId === "CSS_BORDER_RADIUS");
    expect(issue).toBeTruthy();
    expect(issue!.compatScope).toBeUndefined();
  });

  it("suppression reduces the issue count vs default", () => {
    // border-radius is the only compat rule firing here; non-compat rules fire in both runs.
    const suppressed = analyze(html, { clients: ["gmail-desktop-webmail"] });
    const def = analyze(html);
    expect(suppressed.issues.length).toBeLessThan(def.issues.length);
  });

  it('"all" preset produces the same issue set as the default (no clients)', () => {
    // Locks the spec invariant: since no compat feature is universally supported
    // across all clients, the `all` filter keeps every compat issue — same set as
    // the default path. If a future snapshot adds a universally-supported feature,
    // this test fails and flags that `all` no longer equals default.
    const def = analyze(html);
    const all = analyze(html, { clients: [...CLIENT_IDS] });
    expect(all.issues.map((i) => i.ruleId).sort()).toEqual(def.issues.map((i) => i.ruleId).sort());
  });
});
