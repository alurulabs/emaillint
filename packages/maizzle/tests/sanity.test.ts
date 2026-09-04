import { describe, it, expect } from "vitest";
import { lint } from "../src/index.js";

describe("sanity", () => {
  it("lints a fixture template to a finite score and issues array", async () => {
    const result = await lint("tests/fixture/emails/plain.vue");
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.issues)).toBe(true);
  }, 30_000);
});
