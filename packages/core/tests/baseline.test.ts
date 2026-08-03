import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../src/parser/context.js";
import { fingerprint } from "../src/baseline.js";
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
