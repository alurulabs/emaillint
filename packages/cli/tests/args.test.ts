// packages/cli/tests/args.test.ts
import { describe, it, expect } from "vitest";
import { parseArgs, UsageError } from "../src/args.js";

describe("parseArgs", () => {
  it("parses positional paths + defaults", () => {
    const o = parseArgs(["a.html", "b.html"]);
    expect(o.paths).toEqual(["a.html", "b.html"]);
    expect(o.format).toBe("text");
    expect(o.rules).toEqual({});
    expect(o.help).toBe(false);
    expect(o.version).toBe(false);
  });

  it("parses --format json", () => {
    expect(parseArgs(["x.html", "--format", "json"]).format).toBe("json");
  });

  it("rejects invalid --format", () => {
    expect(() => parseArgs(["x.html", "--format", "xml"])).toThrow(UsageError);
  });

  it("parses repeatable --rule ID=LEVEL (both = and space forms), last wins", () => {
    const o = parseArgs(["x.html", "--rule", "CSS_X=off", "--rule=CSS_Y=error", "--rule", "CSS_X=warning"]);
    expect(o.rules).toEqual({ CSS_X: "warning", CSS_Y: "error" });
  });

  it("rejects invalid --rule level / shape", () => {
    expect(() => parseArgs(["x.html", "--rule", "CSS_X=blue"])).toThrow(UsageError);
    expect(() => parseArgs(["x.html", "--rule", "lower=off"])).toThrow(UsageError);
  });

  it("handles -h/--help and -v/--version", () => {
    expect(parseArgs(["--help"]).help).toBe(true);
    expect(parseArgs(["-v"]).version).toBe(true);
  });

  it("rejects unknown flags", () => {
    expect(() => parseArgs(["x.html", "--nope"])).toThrow(UsageError);
  });

  it("rejects --format with no value (argv ends)", () => {
    expect(() => parseArgs(["x.html", "--format"])).toThrow(UsageError);
  });

  it("rejects --rule with no value (argv ends)", () => {
    expect(() => parseArgs(["x.html", "--rule"])).toThrow(UsageError);
  });
});
