import { describe, it, expect } from "vitest";
import { lint } from "../src/index.js";

const BASIC_MJML = `<mjml><mj-body><mj-section><mj-column><mj-text>Hello</mj-text></mj-column></mj-section></mj-body></mjml>`;

describe("lint", () => {
  it("renders MJML and returns an AnalysisResult with score and issues", async () => {
    const result = await lint(BASIC_MJML);
    expect(typeof result.score).toBe("number");
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it("produces HTML that emaillint actually analyzed (score is finite in [0,100])", async () => {
    const result = await lint(BASIC_MJML);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
