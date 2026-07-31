// packages/cli/tests/args.test.ts
import { describe, it, expect } from "vitest";
import { parseArgs, UsageError, resolveCommand } from "../src/args.js";

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

  it("parses --preset (space form) into clientIds", () => {
    const o = parseArgs(["x.html", "--preset", "gmail"]);
    expect(o.preset).toBe("gmail");
    expect(o.clientIds).toEqual(["gmail-desktop-webmail", "gmail-ios", "gmail-android", "gmail-mobile-webmail"]);
  });

  it("parses --preset= (equals form)", () => {
    expect(parseArgs(["x.html", "--preset=outlook"]).clientIds).toContain("outlook-windows");
  });

  it("rejects unknown --preset", () => {
    expect(() => parseArgs(["x.html", "--preset", "lotus-notes"])).toThrow(UsageError);
  });

  it("parses --clients (space form), validates IDs", () => {
    const o = parseArgs(["x.html", "--clients", "gmail-ios,outlook-windows"]);
    expect(o.clientIds.sort()).toEqual(["gmail-ios", "outlook-windows"].sort());
  });

  it("parses --clients= (equals form)", () => {
    expect(parseArgs(["x.html", "--clients=gmail-android"]).clientIds).toEqual(["gmail-android"]);
  });

  it("rejects unknown --clients ID", () => {
    expect(() => parseArgs(["x.html", "--clients", "gmail-forever"])).toThrow(UsageError);
  });

  it("preset + clients union and dedupe", () => {
    const o = parseArgs(["x.html", "--preset", "gmail", "--clients", "gmail-ios,outlook-windows"]);
    expect(o.clientIds.sort()).toEqual([
      "gmail-android", "gmail-desktop-webmail", "gmail-ios", "gmail-mobile-webmail", "outlook-windows",
    ].sort());
  });

  it("rejects --preset / --clients with no value (argv ends)", () => {
    expect(() => parseArgs(["x.html", "--preset"])).toThrow(UsageError);
    expect(() => parseArgs(["x.html", "--clients"])).toThrow(UsageError);
  });

  it("rejects empty --clients value (consistency with --rule=/--preset=)", () => {
    expect(() => parseArgs(["x.html", "--clients", ""])).toThrow(UsageError);
    expect(() => parseArgs(["x.html", "--clients=",])).toThrow(UsageError);
    expect(() => parseArgs(["x.html", "--clients=,,"])).toThrow(UsageError);
  });

  it("resolveCommand recognizes clients/presets, else null", () => {
    expect(resolveCommand("clients")).toBe("clients");
    expect(resolveCommand("presets")).toBe("presets");
    expect(resolveCommand("x.html")).toBeNull();
    expect(resolveCommand("--help")).toBeNull();
  });
});
