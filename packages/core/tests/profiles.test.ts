import { describe, it, expect } from "vitest";
import { PROFILES } from "../src/profiles.js";

describe("PROFILES", () => {
  it("has exactly the three curated profiles", () => {
    expect(Object.keys(PROFILES).sort()).toEqual(["recommended", "relaxed", "strict"]);
  });

  it("recommended is identity (empty shift)", () => {
    expect(PROFILES.recommended).toEqual({});
  });

  it("strict promotes warning -> error and touches nothing else", () => {
    expect(PROFILES.strict).toEqual({ warning: "error" });
  });

  it("relaxed demotes warning -> info and touches nothing else", () => {
    expect(PROFILES.relaxed).toEqual({ warning: "info" });
  });
});
