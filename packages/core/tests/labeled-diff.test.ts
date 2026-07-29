import { describe, it, expect } from "vitest";
import { diffFixture } from "../scripts/labeled/diff.js";

describe("diffFixture", () => {
  it("records a TP when expected fires and no extras", () => {
    const r = diffFixture({ name: "x", expected: ["CSS_GRID"], strict: false }, ["CSS_GRID"]);
    expect(r).toMatchObject({ name: "x", status: "pass", missing: [], extras: [] });
  });

  it("records FN when an expected rule did not fire", () => {
    const r = diffFixture({ name: "x", expected: ["CSS_GRID"], strict: false }, []);
    expect(r.status).toBe("fail");
    expect(r.missing).toEqual(["CSS_GRID"]);
  });

  it("non-strict: extras are reported but status stays pass", () => {
    const r = diffFixture({ name: "x", expected: ["CSS_GRID"], strict: false }, ["CSS_GRID", "CSS_FLOAT"]);
    expect(r.status).toBe("pass");
    expect(r.extras).toEqual(["CSS_FLOAT"]);
  });

  it("strict: any extra fails", () => {
    const r = diffFixture({ name: "x", expected: [], strict: true }, ["CSS_FLOAT"]);
    expect(r.status).toBe("fail");
    expect(r.extras).toEqual(["CSS_FLOAT"]);
  });
});
