import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../src/parser/context.js";

describe("buildEmailContext", () => {
  it("assembles a full context from html", () => {
    const ctx = buildEmailContext('<img src="a.png">');
    expect(ctx.html).toBe('<img src="a.png">');
    expect(ctx.sizeBytes).toBeGreaterThan(0);
    expect(ctx.images).toHaveLength(1);
    expect(ctx.images[0].src).toBe("a.png");
  });

  it("empty html yields no images or links", () => {
    const ctx = buildEmailContext("");
    expect(ctx.images).toHaveLength(0);
    expect(ctx.links).toHaveLength(0);
  });

  it("exposes all context fields", () => {
    const ctx = buildEmailContext('<style>.a{border-radius:4px}</style>');
    expect(ctx.cssDeclarations.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(ctx.elements)).toBe(true);
    expect(Array.isArray(ctx.conditionalComments)).toBe(true);
    expect(Array.isArray(ctx.cssAtRules)).toBe(true);
  });
});
