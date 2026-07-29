import { describe, it, expect } from "vitest";
import { parseFeatureFrontMatter } from "../../scripts/compat/parse.js";

const MD = `---
title: "display:flex"
category: css
last_test_date: "2021-11-02"
stats: {
  outlook: {
    windows:   { "2007": "n", "2019": "n" },
    macos:     { "2019-02": "y" },
  },
  gmail: {
    desktop-webmail: { "2019-02": "y" },
    ios:     { "2019-02": "y", "2020-11": "a #1" },
  },
}
notes_by_num: { "1": "Not supported with non Google accounts.", "2": "Partial, see: docs for details." }
---
body`;

describe("parseFeatureFrontMatter", () => {
  it("extracts scalar fields", () => {
    const d = parseFeatureFrontMatter(MD, "css-display-flex");
    expect(d.slug).toBe("css-display-flex");
    expect(d.lastTested).toBe("2021-11-02");
  });

  it("parses stats with trailing commas + unquoted keys (order preserved)", () => {
    const d = parseFeatureFrontMatter(MD, "css-display-flex");
    expect(d.stats.outlook.windows["2007"]).toBe("n");
    expect(d.stats.gmail.ios["2020-11"]).toBe("a #1");
    expect(Object.keys(d.stats.gmail.ios)).toEqual(["2019-02", "2020-11"]);
  });

  it("parses notes_by_num", () => {
    const d = parseFeatureFrontMatter(MD, "css-display-flex");
    expect(d.notesByNum["1"]).toBe("Not supported with non Google accounts.");
  });

  it("does not corrupt note values containing `, word:` (regression)", () => {
    const d = parseFeatureFrontMatter(MD, "css-display-flex");
    expect(d.notesByNum["2"]).toBe("Partial, see: docs for details.");
  });

  it("returns empty stats when front matter has none", () => {
    const d = parseFeatureFrontMatter("---\ntitle: \"x\"\n---\n", "x");
    expect(d.stats).toEqual({});
  });

  it("tolerates CRLF line endings", () => {
    const md = "---\r\nstats: {\r\n  a: { b: { \"1\": \"y\" } },\r\n}\r\n---\r\nbody";
    const d = parseFeatureFrontMatter(md, "x");
    expect(d.stats.a.b["1"]).toBe("y");
  });
});
