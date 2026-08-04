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
      expect(a11y.helpUri).toBeUndefined(); // a11y rules have no references

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
});
