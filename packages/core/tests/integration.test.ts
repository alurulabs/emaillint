import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { analyze } from "../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readFixture = (rel: string) =>
  readFileSync(path.resolve(__dirname, rel), "utf8");

describe("analyze integration", () => {
  it("scores the clean transactional email at 100", () => {
    const result = analyze(readFixture("fixtures/real/transactional.html"));
    expect(result.score).toBe(100);
    expect(result.issues).toEqual([]);
  });

  it("flags the broken outlook-like email heavily", () => {
    const result = analyze(readFixture("fixtures/broken/outlook-like.html"));
    const ids = result.issues.map((i) => i.ruleId);
    expect(result.score).toBeLessThan(70);
    expect(result.issues.length).toBeGreaterThanOrEqual(5);
    expect(ids).toContain("IMG_MISSING_ALT");
    expect(ids).toContain("EMPTY_LINK");
    expect(ids).toContain("DUPLICATE_ID");
    expect(ids).toContain("BASE64_IMAGE");
    expect(ids).toContain("CSS_FLEXBOX");
    expect(ids).toContain("CSS_BORDER_RADIUS");
    expect(ids).toContain("CSS_BACKGROUND_IMAGE");
    expect(ids).toContain("CSS_ABSOLUTE_POSITION");
    expect(ids).toContain("CSS_EXTERNAL_FONT");
  });
});

describe("phase 2 integration", () => {
  it("porting fixture scores low with invalid + compat issues", () => {
    const result = analyze(readFixture("fixtures/broken/porting/webpage.html"));
    expect(result.score).toBeLessThan(70);
    const ids = new Set(result.issues.map((i) => i.ruleId));
    expect(ids.has("SCRIPT_ELEMENT")).toBe(true);
    expect(ids.has("CSS_FLEXBOX")).toBe(true);
  });

  it("clean mjml fixture scores high", () => {
    const result = analyze(readFixture("fixtures/real/mjml/newsletter.html"));
    expect(result.score).toBeGreaterThan(60);
  });
});
