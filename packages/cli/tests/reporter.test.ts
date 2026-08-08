// packages/cli/tests/reporter.test.ts
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { format } from "../src/reporter.js";
import type { RunResult } from "../src/types.js";

const rr: RunResult = {
  results: [
    {
      path: "b.html",
      result: {
        score: 85,
        issues: [
          { ruleId: "CSS_FLEXBOX", severity: "warning", category: "compatibility", message: "no flex", line: 3, column: 5 },
          { ruleId: "SCRIPT_ELEMENT", severity: "error", category: "invalid", message: "no script" },
        ],
      },
    },
    { path: "a.html", readError: "ENOENT: missing" },
  ],
};

const rrExplain: RunResult = {
  results: [
    {
      path: "e.html",
      result: {
        score: 90,
        issues: [
          { ruleId: "IMG_MISSING_ALT", severity: "warning", category: "accessibility", message: "<img> is missing an alt attribute.", line: 2 },
        ],
      },
    },
  ],
};

describe("reporter", () => {
  it("text: sorted-by-path finding lines + readError + summary", () => {
    const out = format(rr, "text");
    expect(out.indexOf("a.html:")).toBeLessThan(out.indexOf("b.html:")); // a before b
    expect(out).toContain("a.html:  error: ENOENT: missing");
    expect(out).toContain("b.html:3:5  CSS_FLEXBOX  warning  no flex");
    expect(out).toContain("b.html:SCRIPT_ELEMENT  error  no script"); // no line → no loc
    expect(out).toMatch(/2 files, \d+ issues/);
  });

  it("json: parses, has dataVersion + totals, readError rendered as error field", () => {
    const j = JSON.parse(format(rr, "json"));
    expect(typeof j.dataVersion).toBe("string");
    expect(j.files[0]).toEqual({ path: "a.html", error: "ENOENT: missing" }); // a.html first (sorted)
    expect(j.files[1]).toMatchObject({ path: "b.html", score: 85 });
    expect(j.totals).toMatchObject({ files: 2, errors: 2, warnings: 1 }); // script error + readError both count as errors
  });

  it("json: includes clients when present, omits when absent", () => {
    const withClients: RunResult = { ...rr, clients: ["gmail-desktop-webmail"] };
    const j1 = JSON.parse(format(withClients, "json"));
    expect(j1.clients).toEqual(["gmail-desktop-webmail"]);

    const j0 = JSON.parse(format(rr, "json"));
    expect(j0.clients).toBeUndefined();
  });

  it("json: includes a fired-only rules map with remediation", () => {
    const j = JSON.parse(format(rr, "json"));
    expect(j.rules).toBeDefined();
    expect(Object.keys(j.rules).sort()).toEqual(["CSS_FLEXBOX", "SCRIPT_ELEMENT"]);
    expect(j.rules.IMG_MISSING_ALT).toBeUndefined(); // did not fire
    expect(j.rules.SCRIPT_ELEMENT).toMatchObject({
      name: expect.any(String),
      category: expect.any(String),
      why: expect.any(String),
      howToFix: expect.any(String),
    });
    expect(Array.isArray(j.rules.SCRIPT_ELEMENT.references)).toBe(true);
  });

  it("sarif: produces a 2.1.0 doc with rules + results, relativized paths, mapped levels", () => {
    const orig = process.env.GITHUB_WORKSPACE;
    process.env.GITHUB_WORKSPACE = "/repo";
    try {
      const rrAbs: RunResult = {
        results: [{ path: "/repo/b.html", result: { score: 85, issues: rr.results[0].result.issues } }],
      };
      const doc = JSON.parse(format(rrAbs, "sarif"));
      expect(doc.version).toBe("2.1.0");
      expect(doc.$schema).toContain("sarif-schema-2.1.0");
      expect(doc.runs).toHaveLength(1);

      const driver = doc.runs[0].tool.driver;
      expect(driver.name).toBe("emaillint");
      expect(typeof driver.version).toBe("string");
      expect(driver.informationUri).toMatch(/^https:\/\//);
      expect(driver.rules.some((r: { id: string }) => r.id === "CSS_BORDER_RADIUS")).toBe(true);
      const br = driver.rules.find((r: { id: string }) => r.id === "CSS_BORDER_RADIUS");
      expect(br.helpUri).toMatch(/^https:\/\//); // compat rule has references
      expect(br.defaultConfiguration.level).toBe("note"); // CSS_BORDER_RADIUS severity "info" → "note"
      expect(br.fullDescription.text).toContain("Fix:"); // why + howToFix composed
      const a11y = driver.rules.find((r: { id: string }) => r.id === "IMG_MISSING_ALT");
      expect(a11y.helpUri).toMatch(/^https:\/\//); // a11y rules now carry curated references

      const results = doc.runs[0].results;
      const flex = results.find((r: { ruleId: string }) => r.ruleId === "CSS_FLEXBOX");
      expect(flex.level).toBe("warning");
      expect(flex.locations[0].physicalLocation.artifactLocation.uri).toBe("b.html"); // relativized
      expect(flex.locations[0].physicalLocation.region).toEqual({ startLine: 3, startColumn: 5 });
      const script = results.find((r: { ruleId: string }) => r.ruleId === "SCRIPT_ELEMENT");
      expect(script.level).toBe("error");
      expect(script.locations[0].physicalLocation.region).toBeUndefined(); // no line
    } finally {
      if (orig === undefined) delete process.env.GITHUB_WORKSPACE; else process.env.GITHUB_WORKSPACE = orig;
    }
  });

  it("sarif: read-error file becomes an error result with no ruleId", () => {
    const doc = JSON.parse(format(rr, "sarif"));
    const err = doc.runs[0].results.find((r: { ruleId?: string; level: string }) => r.ruleId === undefined && r.level === "error");
    expect(err).toBeTruthy();
    expect(err.message.text).toBe("ENOENT: missing");
  });

  it("sarif: relativizes against cwd when GITHUB_WORKSPACE is unset", () => {
    const orig = process.env.GITHUB_WORKSPACE;
    delete process.env.GITHUB_WORKSPACE;
    try {
      const rrAbs: RunResult = {
        results: [{ path: join(process.cwd(), "b.html"), result: { score: 85, issues: rr.results[0].result.issues } }],
      };
      const doc = JSON.parse(format(rrAbs, "sarif"));
      const flex = doc.runs[0].results.find((r: { ruleId: string }) => r.ruleId === "CSS_FLEXBOX");
      expect(flex.locations[0].physicalLocation.artifactLocation.uri).toBe("b.html");
    } finally {
      if (orig !== undefined) process.env.GITHUB_WORKSPACE = orig;
    }
  });
});

describe("format: baseline", () => {
  const scriptSample = { ruleId: "SCRIPT_ELEMENT", severity: "error", category: "invalid", message: "<script> not supported.", line: 3, column: 1 };
  const newErr = { path: "t.html", fingerprint: "SCRIPT_ELEMENT#script#", count: 2, sample: scriptSample };
  const baselineRR = {
    results: [{ path: "t.html", result: { score: 50, issues: [scriptSample] } }],
    baseline: { mode: "check" as const, newErrors: [newErr], suppressed: 4 },
  };

  it("text: marks new errors with xN and reports suppressed count", () => {
    const out = format(baselineRR as never, "text");
    expect(out).toContain("new");
    expect(out).toContain("x2");
    expect(out).toContain("4 known (suppressed)");
  });

  it("json: keeps totals as full run + additive baseline block", () => {
    const json = JSON.parse(format(baselineRR as never, "json"));
    expect(json.totals.errors).toBe(1); // full current run has 1 error issue
    expect(json.baseline.newErrors).toHaveLength(1);
    expect(json.baseline.suppressed).toBe(4);
  });

  it("sarif: emits only new errors under baseline", () => {
    const sarif = JSON.parse(format(baselineRR as never, "sarif"));
    expect(sarif.runs[0].results).toHaveLength(1);
  });

  it("text: surfaces compatWarning when present", () => {
    const rr = { ...baselineRR, baseline: { ...baselineRR.baseline, compatWarning: "compat data drifted" } };
    expect(format(rr as never, "text")).toContain("compat data drifted");
  });

  it("text: renders readError entries alongside new errors under baseline", () => {
    const rr = {
      results: [{ path: "gone.html", readError: "ENOENT: gone" }],
      baseline: { mode: "check" as const, newErrors: [newErr], suppressed: 4 },
    };
    const out = format(rr as never, "text");
    expect(out).toContain("gone.html:  error: ENOENT: gone");
  });

  it("sarif: readError entries appear in results under baseline", () => {
    const rr = {
      results: [{ path: "gone.html", readError: "ENOENT: gone" }],
      baseline: { mode: "check" as const, newErrors: [newErr], suppressed: 4 },
    };
    const sarif = JSON.parse(format(rr as never, "sarif"));
    const err = sarif.runs[0].results.find((r: { message?: { text?: string } }) => r.message?.text === "ENOENT: gone");
    expect(err).toBeTruthy();
    expect(err.level).toBe("error");
  });

  it("json: rules map is populated under baseline-check", () => {
    const json = JSON.parse(format(baselineRR as never, "json"));
    expect(json.rules).toBeDefined();
    expect(json.rules.SCRIPT_ELEMENT).toBeDefined();
    expect(json.rules.SCRIPT_ELEMENT.howToFix).toEqual(expect.any(String));
  });
});

describe("format: --explain (text)", () => {
  it("appends why/fix/see under a fired issue when explain=true", () => {
    const out = format(rrExplain, "text", true);
    expect(out).toContain("e.html:2:1  IMG_MISSING_ALT  warning");
    expect(out).toContain("  why:");
    expect(out).toContain("  fix:");
    expect(out).toContain("  see:");
  });

  it("omits why/fix/see by default", () => {
    const out = format(rrExplain, "text");
    expect(out).not.toContain("  why:");
    expect(out).not.toContain("  fix:");
    expect(out).not.toContain("  see:");
  });

  it("renders multiple references with a see: label then continuation lines", () => {
    // CSS_EXTERNAL_FONT is the one compat rule whose generated references have
    // multiple entries (2), exercising the i > 0 continuation indent in explainLines.
    const rrMulti: RunResult = {
      results: [
        {
          path: "m.html",
          result: {
            score: 80,
            issues: [
              { ruleId: "CSS_EXTERNAL_FONT", severity: "warning", category: "compatibility", message: "External font (@font-face) has limited email client support.", line: 1 },
            ],
          },
        },
      ],
    };
    const out = format(rrMulti, "text", true);
    const seeLines = out.split("\n").filter((l) => l.startsWith("  see:  "));
    expect(seeLines.length).toBe(1); // exactly one labeled see: line
    // at least one further reference line exists, indented (no see: label)
    expect(out.split("\n").filter((l) => /^        \S/.test(l)).length).toBeGreaterThanOrEqual(1);
  });

  it("enriches new errors under baseline-check when explain=true", () => {
    const sample = { ruleId: "SCRIPT_ELEMENT", severity: "error", category: "invalid", message: "<script> not supported.", line: 3, column: 1 };
    const rrBase: RunResult = {
      results: [{ path: "t.html", result: { score: 50, issues: [sample] } }],
      baseline: { mode: "check", newErrors: [{ path: "t.html", fingerprint: "SCRIPT_ELEMENT#script#", count: 1, sample }], suppressed: 0 },
    };
    const out = format(rrBase, "text", true);
    expect(out).toContain("SCRIPT_ELEMENT");
    expect(out).toContain("  why:");
    expect(out).toContain("  fix:");
  });

  it("is a no-op for json (rules map is always present regardless)", () => {
    const j = JSON.parse(format(rrExplain, "json", true));
    expect(j.rules.IMG_MISSING_ALT).toBeDefined();
  });
});
