import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../src/parser/context.js";
import { fingerprint, createBaseline, diffAgainstBaseline } from "../src/baseline.js";
import type { BaselineFile } from "../src/baseline.js";
import type { Issue } from "../src/types/index.js";

const mkIssue = (over: Partial<Issue> & { ruleId: string }): Issue => ({
  severity: "error", category: "accessibility", message: "m", ...over,
});

describe("fingerprint", () => {
  it("element-scoped: ruleId + tag + sorted allowlist attrs (class/style/data-* excluded)", () => {
    const ctx = buildEmailContext(`<img src="logo.png" width="200" class="hero" style="display:block" data-x="1">`);
    const issue = mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 1 });
    expect(fingerprint(ctx, issue)).toBe("IMG_MISSING_ALT#img#src=logo.png&width=200");
  });

  it("element-scoped: attribute order is canonicalized (sorted)", () => {
    const ctx = buildEmailContext(`<img width="200" src="logo.png">`);
    const issue = mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 1 });
    expect(fingerprint(ctx, issue)).toBe("IMG_MISSING_ALT#img#src=logo.png&width=200");
  });

  it("css-declaration: ruleId + selector + property + value (no message)", () => {
    const ctx = buildEmailContext(`<style>body .hero { display: flex; }</style>`);
    const decl = ctx.cssDeclarations.find((d) => d.property === "display")!;
    const issue = mkIssue({ ruleId: "CSS_FLEXBOX", category: "compatibility", line: decl.line, column: decl.column });
    expect(fingerprint(ctx, issue)).toBe("CSS_FLEXBOX#body .hero#display#flex");
  });

  it("document-level: ruleId only when no element/declaration matches", () => {
    const ctx = buildEmailContext(`<html><body></body></html>`);
    const issue = mkIssue({ ruleId: "HTML_SIZE_EXCEEDED", category: "performance" });
    expect(fingerprint(ctx, issue)).toBe("HTML_SIZE_EXCEEDED");
  });

  it("two elements sharing allowlist attrs collide (drives count-based diff)", () => {
    const ctx = buildEmailContext(`<img src="logo.png"><img src="logo.png">`);
    const a = mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 1 });
    // col 21: parse5 1-indexes columns, and the first <img src="logo.png"> is 20 chars wide.
    const b = mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 21 });
    expect(fingerprint(ctx, a)).toBe(fingerprint(ctx, b));
  });
});

describe("createBaseline", () => {
  const ctx = buildEmailContext(`<img src="a.png"><img src="a.png"><script>x</script>`);
  const issues: Issue[] = [
    mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 1 }),
    mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 18 }),
    mkIssue({ ruleId: "SCRIPT_ELEMENT", severity: "error", category: "invalid", line: 1, column: 35 }),
    mkIssue({ ruleId: "SOME_WARNING", severity: "warning", line: 1, column: 1 }),
  ];

  it("fingerprints only error-severity issues, counts duplicates", () => {
    const b = createBaseline([{ path: "t.html", issues, ctx }]);
    expect(b.files["t.html"]).toEqual({ "IMG_MISSING_ALT#img#src=a.png": 2, "SCRIPT_ELEMENT#script#": 1 });
  });

  it("omits files with zero errors", () => {
    const b = createBaseline([{ path: "clean.html", issues: [], ctx }]);
    expect(b.files).toEqual({});
  });

  it("sorts fingerprints and file paths (deterministic output)", () => {
    const b = createBaseline([
      { path: "z.html", issues: [mkIssue({ ruleId: "B_EL", line: 1, column: 1 })], ctx: buildEmailContext(`<b></b>`) },
      { path: "a.html", issues: [mkIssue({ ruleId: "A_EL", line: 1, column: 1 })], ctx: buildEmailContext(`<a></a>`) },
    ]);
    expect(Object.keys(b.files)).toEqual(["a.html", "z.html"]);
  });

  it("sets version, fingerprintVersion, compatDataVersion; clients only when passed", () => {
    const b = createBaseline([{ path: "t.html", issues, ctx }]);
    expect(b.version).toBe(1);
    expect(b.fingerprintVersion).toBe(1);
    expect(typeof b.compatDataVersion).toBe("string");
    expect(b.clients).toBeUndefined();
    const bc = createBaseline([{ path: "t.html", issues, ctx }], { clients: ["gmail-ios", "gmail-desktop-webmail"] as never });
    expect(bc.clients).toEqual(["gmail-desktop-webmail", "gmail-ios"]); // sorted
  });
});

describe("diffAgainstBaseline", () => {
  const ctx = buildEmailContext(`<img src="a.png"><img src="a.png">`);
  const twoImgs: Issue[] = [
    mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 1 }),
    mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 18 }),
  ];

  it("no new errors when current matches baseline count", () => {
    const baseline = createBaseline([{ path: "t.html", issues: twoImgs, ctx }]);
    const d = diffAgainstBaseline([{ path: "t.html", issues: twoImgs, ctx }], baseline);
    expect(d.newErrors).toEqual([]);
    expect(d.suppressed).toBe(2);
  });

  it("duplicate-add (count increase) is caught; a Set would mask it", () => {
    const three = buildEmailContext(`<img src="a.png"><img src="a.png"><img src="a.png">`);
    const threeImgs: Issue[] = [
      mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 1 }),
      mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 18 }),
      mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 35 }),
    ];
    const baseline = createBaseline([{ path: "t.html", issues: twoImgs, ctx }]);
    const d = diffAgainstBaseline([{ path: "t.html", issues: threeImgs, ctx: three }], baseline);
    expect(d.newErrors).toHaveLength(1);
    expect(d.newErrors[0].count).toBe(1);
    expect(d.newErrors[0].fingerprint).toBe("IMG_MISSING_ALT#img#src=a.png");
    expect(d.newErrors[0].sample.ruleId).toBe("IMG_MISSING_ALT");
    expect(d.suppressed).toBe(2);
  });

  it("fixing one of N: 0 new, suppressed shrinks", () => {
    const one = buildEmailContext(`<img src="a.png">`);
    const oneImg: Issue[] = [mkIssue({ ruleId: "IMG_MISSING_ALT", line: 1, column: 1 })];
    const baseline = createBaseline([{ path: "t.html", issues: twoImgs, ctx }]);
    const d = diffAgainstBaseline([{ path: "t.html", issues: oneImg, ctx: one }], baseline);
    expect(d.newErrors).toEqual([]);
    expect(d.suppressed).toBe(1);
  });

  it("new file (not in baseline): all current errors are new", () => {
    const baseline: BaselineFile = { version: 1, fingerprintVersion: 1, files: {} };
    const d = diffAgainstBaseline([{ path: "new.html", issues: twoImgs, ctx }], baseline);
    expect(d.newErrors).toHaveLength(1);
    expect(d.newErrors[0].count).toBe(2);
    expect(d.suppressed).toBe(0);
  });

  it("cross-file isolation: same fingerprint in two files does not mask", () => {
    const baseline = createBaseline([{ path: "a.html", issues: twoImgs, ctx }]);
    const d = diffAgainstBaseline([{ path: "b.html", issues: twoImgs, ctx }], baseline);
    expect(d.newErrors).toHaveLength(1); // b.html is new, both flagged
    expect(d.suppressed).toBe(0);
  });
});
