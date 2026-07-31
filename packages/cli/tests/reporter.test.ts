// packages/cli/tests/reporter.test.ts
import { describe, it, expect } from "vitest";
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
});
