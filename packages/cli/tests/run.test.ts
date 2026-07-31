// packages/cli/tests/run.test.ts
import { describe, it, expect } from "vitest";
import { join, relative } from "node:path";
import { run, NoFilesMatched } from "../src/run.js";

const FX = join(import.meta.dirname, "fixtures");

describe("run", () => {
  it("clean file → 0 issues", async () => {
    const rr = await run([join(FX, "clean.html")], {});
    expect(rr.results).toHaveLength(1);
    expect("readError" in rr.results[0]).toBe(false);
    if (!("readError" in rr.results[0])) expect(rr.results[0].result.issues).toEqual([]);
  });

  it("dirty file → expected rules (incl. error)", async () => {
    const rr = await run([join(FX, "dirty.html")], {});
    const r = rr.results[0];
    expect("readError" in r).toBe(false);
    if (!("readError" in r)) {
      const ids = r.result.issues.map((i) => i.ruleId);
      expect(ids).toContain("CSS_FLEXBOX");
      expect(ids).toContain("SCRIPT_ELEMENT");
    }
  });

  it("missing file → readError", async () => {
    const rr = await run([join(FX, "nope.html")], {});
    expect(rr.results[0]).toMatchObject({ readError: expect.any(String) });
  });

  it("rule override suppresses a rule", async () => {
    const rr = await run([join(FX, "dirty.html")], { rules: { CSS_FLEXBOX: "off" } });
    const r = rr.results[0];
    if (!("readError" in r)) {
      expect(r.result.issues.map((i) => i.ruleId)).not.toContain("CSS_FLEXBOX");
    }
  });

  it("glob matches the fixtures", async () => {
    const rr = await run([join(FX, "*.html")], {});
    expect(rr.results.map((f) => f.path).sort()).toEqual([join(FX, "clean.html"), join(FX, "dirty.html")].sort());
  });

  it("no matches → NoFilesMatched", async () => {
    await expect(run([join(FX, "*.nope")], {})).rejects.toBeInstanceOf(NoFilesMatched);
  });

  it("passes clients through to the engine and RunResult", async () => {
    const rr = await run([join(FX, "dirty.html")], { clients: ["gmail-desktop-webmail"] });
    expect(rr.clients).toEqual(["gmail-desktop-webmail"]);
    // CSS_FLEXBOX is supported in gmail → suppressed under this filter.
    const r = rr.results[0];
    if (!("readError" in r)) {
      expect(r.result.issues.map((i) => i.ruleId)).not.toContain("CSS_FLEXBOX");
    }
  });

  it("dedupes a literal path that a glob also matches", async () => {
    // relative literal + absolute glob: without resolving literals to absolute,
    // the Set can't dedup relative vs absolute and the file is reported twice.
    const rel = relative(process.cwd(), join(FX, "clean.html"));
    const rr = await run([rel, join(FX, "*.html")], {});
    const cleanHits = rr.results.filter((f) => f.path.endsWith("clean.html")).length;
    expect(cleanHits).toBe(1);
  });
});
